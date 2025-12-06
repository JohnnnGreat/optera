import { Routes } from '@angular/router';

export const projectRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/project-list/project-list.component').then(
        (c) => c.ProjectListComponent
      ),
    title: 'Projects - Optera',
  },
  // {
  //   path: 'new',
  //   loadComponent: () =>
  //     import('./components/project-form/project-form.component').then(c => c.ProjectFormComponent),
  //   title: 'New Project - Optera'
  // },
  // {
  //   path: ':id',
  //   loadComponent: () =>
  //     import('./components/project-detail/project-detail.component').then(c => c.ProjectDetailComponent),
  //   title: 'Project Details - Optera'
  // },
  // {
  //   path: ':id/edit',
  //   loadComponent: () =>
  //     import('./components/project-form/project-form.component').then(c => c.ProjectFormComponent),
  //   title: 'Edit Project - Optera'
  // }
];
