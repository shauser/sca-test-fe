import { Component, OnInit, OnDestroy } from '@angular/core'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { takeUntil, Subject, first } from 'rxjs'
import { PaperlessTask } from 'src/app/data/paperless-task'
import { TasksService } from 'src/app/services/tasks.service'
import { ConfirmDialogComponent } from '../../common/confirm-dialog/confirm-dialog.component'

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
})
export class TasksComponent implements OnInit, OnDestroy {
  public activeTab: string
  public selectedTasks: Set<number> = new Set()
  private unsubscribeNotifer = new Subject()
  public expandedTask: number

  get dismissButtonText(): string {
    return this.selectedTasks.size > 0
      ? $localize`Dismiss selected`
      : $localize`Dismiss all`
  }

  constructor(
    public tasksService: TasksService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.tasksService.reload()
  }

  ngOnDestroy() {
    this.unsubscribeNotifer.next(true)
  }

  dismissTask(task: PaperlessTask) {
    this.dismissTasks(task)
  }

  dismissTasks(task: PaperlessTask = undefined) {
    let tasks = task ? new Set([task.id]) : this.selectedTasks
    if (!task && this.selectedTasks.size == 0)
      tasks = new Set(this.tasksService.allFileTasks.map((t) => t.id))
    if (tasks.size > 1) {
      let modal = this.modalService.open(ConfirmDialogComponent, {
        backdrop: 'static',
      })
      modal.componentInstance.title = $localize`Confirm Dismiss All`
      modal.componentInstance.messageBold =
        $localize`Dismiss all` + ` ${tasks.size} ` + $localize`tasks?`
      modal.componentInstance.btnClass = 'btn-warning'
      modal.componentInstance.btnCaption = $localize`Dismiss`
      modal.componentInstance.confirmClicked.pipe(first()).subscribe(() => {
        modal.componentInstance.buttonsEnabled = false
        modal.close()
        this.tasksService.dismissTasks(tasks)
        this.selectedTasks.clear()
      })
    } else {
      this.tasksService.dismissTasks(tasks)
      this.selectedTasks.clear()
    }
  }

  expandTask(task: PaperlessTask) {
    this.expandedTask = this.expandedTask == task.id ? undefined : task.id
  }

  toggleSelected(task: PaperlessTask) {
    this.selectedTasks.has(task.id)
      ? this.selectedTasks.delete(task.id)
      : this.selectedTasks.add(task.id)
  }

  get currentTasks(): PaperlessTask[] {
    let tasks: PaperlessTask[]
    switch (this.activeTab) {
      case 'PENDING':
        tasks = this.tasksService.queuedFileTasks
        break
      case 'STARTED':
        tasks = this.tasksService.startedFileTasks
        break
      case 'SUCCESS':
        tasks = this.tasksService.completedFileTasks
        break
      case 'FAILURE':
        tasks = this.tasksService.failedFileTasks
        break
      default:
        break
    }
    return tasks
  }

  toggleAll(event: PointerEvent) {
    if ((event.target as HTMLInputElement).checked) {
      this.selectedTasks = new Set(this.currentTasks.map((t) => t.id))
    } else {
      this.clearSelection()
    }
  }

  clearSelection() {
    this.selectedTasks.clear()
  }
}
