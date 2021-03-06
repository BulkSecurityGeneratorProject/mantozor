import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { JhiEventManager, JhiAlertService, JhiDataUtils } from 'ng-jhipster';

import { MantisImport } from './mantis-import.model';
import { MantisImportPopupService } from './mantis-import-popup.service';
import { MantisImportService } from './mantis-import.service';
import { User, UserService } from '../../shared';

@Component({
    selector: 'jhi-mantis-import-dialog',
    templateUrl: './mantis-import-dialog.component.html'
})
export class MantisImportDialogComponent implements OnInit {

    mantisImport: MantisImport;
    isSaving: boolean;

    users: User[];
    importDateDp: any;

    constructor(
        public activeModal: NgbActiveModal,
        private dataUtils: JhiDataUtils,
        private jhiAlertService: JhiAlertService,
        private mantisImportService: MantisImportService,
        private userService: UserService,
        private eventManager: JhiEventManager
    ) {
    }

    ngOnInit() {
        this.isSaving = false;
        this.userService.query()
            .subscribe((res: HttpResponse<User[]>) => { this.users = res.body; }, (res: HttpErrorResponse) => this.onError(res.message));
    }

    byteSize(field) {
        return this.dataUtils.byteSize(field);
    }

    openFile(contentType, field) {
        return this.dataUtils.openFile(contentType, field);
    }

    setFileData(event, entity, field, isImage) {
        this.dataUtils.setFileData(event, entity, field, isImage);
    }

    clear() {
        this.activeModal.dismiss('cancel');
    }

    save() {
        this.isSaving = true;
        if (this.mantisImport.id !== undefined) {
            this.subscribeToSaveResponse(
                this.mantisImportService.update(this.mantisImport));
        } else {
            this.subscribeToSaveResponse(
                this.mantisImportService.create(this.mantisImport));
        }
    }

    private subscribeToSaveResponse(result: Observable<HttpResponse<MantisImport>>) {
        result.subscribe((res: HttpResponse<MantisImport>) =>
            this.onSaveSuccess(res.body), (res: HttpErrorResponse) => this.onSaveError());
    }

    private onSaveSuccess(result: MantisImport) {
        this.eventManager.broadcast({ name: 'mantisImportListModification', content: 'OK'});
        this.isSaving = false;
        this.activeModal.dismiss(result);
    }

    private onSaveError() {
        this.isSaving = false;
    }

    private onError(error: any) {
        this.jhiAlertService.error(error.message, null, null);
    }

    trackUserById(index: number, item: User) {
        return item.id;
    }
}

@Component({
    selector: 'jhi-mantis-import-popup',
    template: ''
})
export class MantisImportPopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private mantisImportPopupService: MantisImportPopupService
    ) {}

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            if ( params['id'] ) {
                this.mantisImportPopupService
                    .open(MantisImportDialogComponent as Component, params['id']);
            } else {
                this.mantisImportPopupService
                    .open(MantisImportDialogComponent as Component);
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
