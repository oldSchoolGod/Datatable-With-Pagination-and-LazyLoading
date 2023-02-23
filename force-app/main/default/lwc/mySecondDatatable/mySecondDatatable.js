import { LightningElement, wire, api, track} from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getOpps from '@salesforce/apex/getData.getOpps'

const columns = [{
        label: 'Name',
        fieldName: 'Name',
        type: 'text',
        sortable: true
    },
    {
        label: 'Stage',
        fieldName: 'StageName',
        sortable: true
    },
    {
        label: 'Close Date',
        fieldName: 'CloseDate',
        sortable: true
    }
];

export default class MySecondDatatable extends LightningElement {
   @track value;
   @track error;
   @track data;
   @api sortedDirection = 'asc';
   @api sortedBy = 'Name';
   @api searchKey = '';
   result;
   delayTimeout;
   totalSelected=0;
   totalrecord ;
   @track allSelectedRows = [];
   @track page = 1; 
   @track items = []; 
   @track data = []; 
   @track columns; 
   @track startingRecord = 1;
   @track endingRecord = 0; 
   @track pageSize = 10; 
   @track totalRecountCount = 0;
   @track totalPage = 0;
   isPageChanged = false;
   initialLoad = true;
   mapoppNameVsOpp = new Map();;
 
   @wire(getOpps, {searchKey: '$searchKey', sortBy: '$sortedBy', sortDirection: '$sortedDirection'})
   wiredAccounts({ error, data }) {
       if (data) {
           this.processRecords(data);
           this.error = undefined;
       } else if (error) {
           this.error = error;
           this.data = undefined;
       }
   }
   get renderSaveButton() { 
      return this.allSelectedRows.length>0?true:false;
    }
   
   processRecords(data){
      this.totalrecord = data.length;
      var selectedIds = [];
         for(var i=0; i<this.allSelectedRows.length;i++){
            selectedIds.push(this.allSelectedRows[i]);
         }
      this.template.querySelector(
         '[data-id="table"]'
       ).selectedRows = selectedIds;
      
           this.items = data;
           this.totalRecountCount = data.length; 
           // no of pages 
           this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize); 
           this.data = this.items.slice(0,this.pageSize); 
           this.endingRecord = this.pageSize;
           this.columns = columns;
   }
   //clicking on previous button this method will be called
   previousHandler() {
       this.isPageChanged = true;
       if (this.page > 1) {
           this.page = this.page - 1; //decrease page by 1
           this.displayRecordPerPage(this.page);
       }
         var selectedIds = [];
         for(var i=0; i<this.allSelectedRows.length;i++){
            selectedIds.push(this.allSelectedRows[i]);
         }
      
         
         this.template.querySelector(
             '[data-id="table"]'
           ).selectedRows = selectedIds;
   }

   //clicking on next button this method will be called
   nextHandler() {
       this.isPageChanged = true;
       if((this.page<this.totalPage) && this.page !== this.totalPage){
           this.page = this.page + 1; //increase page by 1
           this.displayRecordPerPage(this.page);            
       }
         var selectedIds = [];
         for(var i=0; i<this.allSelectedRows.length;i++){
           selectedIds.push(this.allSelectedRows[i]);
         }
         
        
       this.template.querySelector(
           '[data-id="table"]'
         ).selectedRows = selectedIds;
   }

   //this method displays records page by page
   displayRecordPerPage(page){

       this.startingRecord = ((page -1) * this.pageSize) ;
       this.endingRecord = (this.pageSize * page);

       this.endingRecord = (this.endingRecord > this.totalRecountCount) 
                           ? this.totalRecountCount : this.endingRecord; 

       this.data = this.items.slice(this.startingRecord, this.endingRecord);
       this.startingRecord = this.startingRecord + 1;
   }    
   
   sortColumns( event ) {
       this.sortedBy = event.detail.fieldName;
       this.sortedDirection = event.detail.sortDirection;
       return refreshApex(this.result);
       
   }
   
   onRowSelection(evt){
      console.log(`onRowSelection ispagechnage ${this.isPageChanged} initialLoad ${this.initialLoad}`);

       // List of selected items from the data table event.
    let updatedItemsSet = new Set();
    // List of selected items we maintain.
    let selectedItemsSet = new Set(this.allSelectedRows);
    
    // List of items currently loaded for the current view.
    let loadedItemsSet = new Set();

   
    this.data.map((event) => {
    
      loadedItemsSet.add(event.Id);
    });


    if (evt.detail.selectedRows) {
      evt.detail.selectedRows.map((event) => {
        updatedItemsSet.add(event.Id);
      });


      // Add any new items to the selection list
      updatedItemsSet.forEach((id) => {
        if (!selectedItemsSet.has(id)) {
          selectedItemsSet.add(id);
        }
      });
    }


    loadedItemsSet.forEach((id) => {
      if (selectedItemsSet.has(id) && !updatedItemsSet.has(id)) {
        // Remove any items that were unselected.
        selectedItemsSet.delete(id);
      }
    });


    this.allSelectedRows = [...selectedItemsSet];
    this.totalSelected = Number(this.allSelectedRows.length);
    
       
   }
   
   
   handleKeyChange( event ) {
      this.searchKey = event.target.value;
      console.log(this.searchKey);
         const data = [];
         for(var i=0; i<this.items.length;i++){
             if(this.items[i]!= undefined && this.items[i].Name.includes(this.searchKey)){
                 data.push(this.items[i]);
             }
         }
         console.log('data in handkrychange '+JSON.stringify(data));
         this.processRecords(data);
         
   }
   handleClick(){
      console.log(JSON.stringify(this.allSelectedRows));
   }
}