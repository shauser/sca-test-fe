import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppFrameComponent } from './components/app-frame/app-frame.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DocumentDetailComponent } from './components/document-detail/document-detail.component';
import { DocumentListComponent } from './components/document-list/document-list.component';
import { CorrespondentListComponent } from './components/manage/correspondent-list/correspondent-list.component';
import { DocumentTypeListComponent } from './components/manage/document-type-list/document-type-list.component';
import { LogsComponent } from './components/manage/logs/logs.component';
import { SettingsComponent } from './components/manage/settings/settings.component';
import { TagListComponent } from './components/manage/tag-list/tag-list.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { SearchComponent } from './components/search/search.component';
import { DirtyFormGuard } from './guards/dirty-form.guard';

const routes: Routes = [
  {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
  {path: '', component: AppFrameComponent, children: [
    {path: 'dashboard', component: DashboardComponent },
    {path: 'documents', component: DocumentListComponent },
    {path: 'view/:id', component: DocumentListComponent },
    {path: 'search', component: SearchComponent },
    {path: 'documents/:id', component: DocumentDetailComponent },
    {path: 'tags', component: TagListComponent },
    {path: 'documenttypes', component: DocumentTypeListComponent },
    {path: 'correspondents', component: CorrespondentListComponent },
    {path: 'logs', component: LogsComponent },
    {path: 'settings', component: SettingsComponent, canDeactivate: [DirtyFormGuard] },
  ]},

  {path: '404', component: NotFoundComponent},
  {path: '**', redirectTo: '/404', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
