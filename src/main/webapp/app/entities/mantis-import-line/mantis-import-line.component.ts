import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { JhiEventManager, JhiParseLinks, JhiAlertService } from 'ng-jhipster';

import { FormArray, FormGroup, FormControl, FormBuilder } from '@angular/forms';

import { MantisImportLine } from './mantis-import-line.model';
import { MantisImport, MantisImportService } from '../mantis-import';
import { MantisImportLineService } from './mantis-import-line.service';
import { ITEMS_PER_PAGE, Principal } from '../../shared';

@Component({
    selector: 'jhi-mantis-import-line',
    templateUrl: './mantis-import-line.component.html'
})
export class MantisImportLineComponent implements OnInit, OnDestroy {
  
    currentAccount: any;
    mantisImportLines: MantisImportLine[];
    error: any;
    success: any;
    eventSubscriber: Subscription;
    routeData: any;
    links: any;
    totalItems: any;
    queryCount: any;
    itemsPerPage: any;
    page: any;
    predicate: any;
    previousPage: any;
    reverse: any;
    criteria: any;
    
    mantisimports: MantisImport[];

    rowModels: any[];
    filterForm: FormGroup;

    filterFields: any;
    filterComparators: any;

    constructor(
        private mantisImportLineService: MantisImportLineService,
        private parseLinks: JhiParseLinks,
        private jhiAlertService: JhiAlertService,
        private principal: Principal,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private eventManager: JhiEventManager,
        private formBuilder: FormBuilder,
        private mantisImportService: MantisImportService,
    ) {
    

        this.itemsPerPage = ITEMS_PER_PAGE;
        this.routeData = this.activatedRoute.data.subscribe((data) => {
            this.page = data.pagingParams.page;
            this.previousPage = data.pagingParams.page;
            this.reverse = data.pagingParams.ascending;
            this.predicate = data.pagingParams.predicate;
        });
        this.criteria = {
            mantisNumber: null,
            areSet() {
                return this.mantisNumber != null ;
            },
            clear() {
                this.mantisNumber = null;
            }
        }
        this.filterFields = this.getFilterFields();
        this.filterComparators = this.getFilterComparators(null);

        this.rowModels = [{}];
        this.filterForm = this.formBuilder.group({
          filterRows: this.formBuilder.array([this.initFilterRows()])
        });
        const control = <FormArray>this.filterForm.controls['filterRows'];
        const group = <FormGroup>control.controls[0];
        group.controls['concernedField'].setValue('mantisNumber', {onlySelf: true});
        //group.controls['criteriaValue'].setValue('cool', {onlySelf: true});
    }

  initFilterRows(){
    this.rowModels.push({comparators:[]});
    return this.formBuilder.group({
        concernedField: {label:'mantisNumber', value:'mantisNumber', category:'text'},
        comparator: {key:'contains', value:'contains', label:'Contains'},
        criteriaValue: '',
    });
  }
  addCriteria(){
    const control = <FormArray>this.filterForm.controls['filterRows'];
    control.push(this.initFilterRows());
  }

  removeCriteria(index){
    const control = <FormArray>this.filterForm.controls['filterRows'];
    control.removeAt(index);
    this.rowModels.splice(index, 1);
  }

  fieldChanged(event, index){
    console.log(event);
    this.rowModels[index].comparators = this.getFilterComparators(event);
  }

  comparatorChanged(event){
    console.log(event);
  }

    loadAll() {
        const criteria = [];

        this.filterForm.value.filterRows.forEach(function (value) {
          console.log(value);
          if(value.concenedField !== null && value.concernedField !== '' &&
              value.comparator !== null && value.comparator !== '' && 
              value.criteriaValue !== null && value.criteriaValue !== ''){
              if(value.comparator.key === 'in'){
              	criteria.push({key: value.concernedField.value + '.' + value.comparator.key, value: value.criteriaValue.split('|')});
              }else{
              	criteria.push({key: value.concernedField.value + '.' + value.comparator.key, value: value.criteriaValue});
              }
            
          }
        });

        this.mantisImportLineService.query({
            page: this.page - 1,
            size: this.itemsPerPage,
            sort: this.sort(),
            criteria}).subscribe(
                (res: HttpResponse<MantisImportLine[]>) => this.onSuccess(res.body, res.headers),
                (res: HttpErrorResponse) => this.onError(res.message)
        );
    }
    loadPage(page: number) {
        if (page !== this.previousPage) {
            this.previousPage = page;
            this.transition();
        }
    }
    transition() {
        this.router.navigate(['/mantis-import-line'], {queryParams:
            {
                page: this.page,
                size: this.itemsPerPage,
                sort: this.predicate + ',' + (this.reverse ? 'asc' : 'desc')
            }
        });
        this.loadAll();
    }

    clear() {
        this.page = 0;
        this.router.navigate(['/mantis-import-line', {
            page: this.page,
            sort: this.predicate + ',' + (this.reverse ? 'asc' : 'desc')
        }]);
        this.criteria.clear();
        this.loadAll();
    }

    ngOnInit() {
    	setTimeout(() => {
	        this.mantisImportService.query().subscribe((res: HttpResponse<MantisImport[]>) => { 
	            	this.mantisimports = res.body; 
	            	console.log(this.mantisimports);
	            }, 
	            (res: HttpErrorResponse) => this.onError(res.message)
	        );
        }, 0);
       
        
        this.loadAll();
        
        
        
        this.principal.identity().then((account) => {
            this.currentAccount = account;
        });
        
        this.registerChangeInMantisImportLines();
		
    }

    ngOnDestroy() {
        this.eventManager.destroy(this.eventSubscriber);
    }

    trackId(index: number, item: MantisImportLine) {
        return item.id;
    }
    registerChangeInMantisImportLines() {
        this.eventSubscriber = this.eventManager.subscribe('mantisImportLineListModification', (response) => this.loadAll());
    }

    sort() {
        const result = [this.predicate + ',' + (this.reverse ? 'asc' : 'desc')];
        if (this.predicate !== 'id') {
            result.push('id');
        }
        return result;
    }

    search(criteria) {
        if (criteria.areSet()) {
            this.loadAll();
        }
    }

    private onSuccess(data, headers) {
        this.links = this.parseLinks.parse(headers.get('link'));
        this.totalItems = headers.get('X-Total-Count');
        this.queryCount = this.totalItems;
        // this.page = pagingParams.page;
        this.mantisImportLines = data;
    }
    private onError(error) {
        this.jhiAlertService.error(error.message, null, null);
    }

  getFilterComparators(field: any){
    let comparators = [];
    if(field !== null){
      if(field.category == "text"){
          comparators = [
          {key:'contains', value:'contains', label:'Contains'},
            {key:'equals', value:'equals', label:'Equals (=)'},
            {key:'in', value:'in', label:'In'},
          ];
      }else if(field.category == "number" || field.category == "date"){
        comparators = [
            {key:'equals', value:'equals', label:'Equals (=)'},
            {key:'greaterThan', value:'greaterThan', label:'Greater than (>)'},
            {key:'lessThan', value:'lessThan', label:'Less than (<)'},
            {key:'greaterOrEqualThan', value:'greaterOrEqualThan', label:'Greater than or equals to (>=)'},
            {key:'lessOrEqualThan', value:'lessOrEqualThan', label:'Less than or equals to (<=)'},
        ];
      }
    }

    return comparators;
  }

  getFilterFields(){
    let fields = [
        {label:'mantisNumber', value:'mantisNumber', category:'text'},
        {label:'validationStatus', value:'validationStatus', category:'text'},
        {label:'project', value:'project', category:'text'},
        {label:'updateDate', value:'updateDate', category:'date'},
        {label:'category', value:'category', category:'text'},
        {label:'gravity', value:'gravity', category:'text'},
        {label:'augeoReference', value:'augeoReference', category:'text'},
        {label:'technicalReference', value:'technicalReference', category:'text'},
        {label:'description', value:'description', category:'text'},
        {label:'submissionDate', value:'submissionDate', category:'date'},
        {label:'desiredCommitmentDate', value:'desiredCommitmentDate', category:'date'},
        {label:'estimatedChargeCACF', value:'estimatedChargeCACF', category:'number'},
        {label:'commitmentDateCDS', value:'commitmentDateCDS', category:'date'},
        {label:'estimatedChargeCDS', value:'estimatedChargeCDS', category:'number'},
        {label:'estimatedDSTDelivreryDate', value:'estimatedDSTDelivreryDate', category:'date'},
        {label:'recipeDate', value:'recipeDate', category:'date'},
        {label:'productionDate', value:'productionDate', category:'date'},
        {label:'estimatedChargeCDS', value:'estimatedChargeCDS', category:'number'},
        {label:'devStandardsComplianceScore', value:'devStandardsComplianceScore', category:'text'},
        {label:'devStandardsComplianceScoreComment', value:'devStandardsComplianceScore', category:'text'},
        {label:'expressedNeedsComplianceScore', value:'expressedNeedsComplianceScore', category:'text'},
        {label:'expressedNeedsComplianceScoreComment', value:'expressedNeedsComplianceScoreComment', category:'text'},
        {label:'overallDeadlineRespectScore', value:'overallDeadlineRespectScore', category:'text'},
        {label:'overallDeadlineRespectScoreComment', value:'overallDeadlineRespectScoreComment', category:'text'},
    ];
    return fields;
  }
}
