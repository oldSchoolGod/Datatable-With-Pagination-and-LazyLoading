import { LightningElement,wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getRecords from '@salesforce/apex/RelatedListController.getRecords';
import findAccount from '@salesforce/apex/RelatedListController.findAccount';
 /** The delay used when debouncing event handlers before invoking Apex. */
const DELAY = 500;
const columns = [
    { label: 'Account Name', fieldName: 'linkAccount', type: 'url',
        typeAttributes: {
            label: { fieldName: 'Name' },
            target: '_blank'
        } 
    },
    { label: 'Account Number', fieldName: 'AccountNumber', type: 'text'},
    { label: 'Created Date', fieldName: 'CreatedDate', type: 'text'}
];

export default class MyDataTableWithInfiniteLazyLoadingAndSearch extends LightningElement {
   columns = columns;
    data = [];
    error;
    totalNumberOfRows; // stop the infinite load after this threshold count
    // offSetCount to send to apex to get the subsequent result. 0 in offSetCount signifies for the initial load of records on component load.
    offSetCount = 0;
    loadMoreStatus;
    targetDatatable; // capture the loadmore event to fetch data and stop infinite loading
    mySearchedAccount=[]
    filterData = [];
    allSelectedRows=[];
    prevSelctedRows =[];
    prevRecord = [];
    totalSelected = 0;
    inSearch= false;
    selectedRows=[];
    allData = [];

    searchKey = '';
    
   
    @wire(findAccount)
    wireAccount({ error, data }) {
        if (data) {
            console.log('wire data',data.length);
            data = JSON.parse(JSON.stringify(data));
             data.forEach(record => {
                    record.linkAccount = '/' + record.Id;
                });
           
            this.allData = data;
             this.totalNumberOfRows = this.allData.length;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.contacts = undefined;
        }
    }

    connectedCallback() {
        //Get initial chunk of data with offset set at 0
        console.log('connected callback');
        this.getRecords();
    }
 
    getRecords() {
        getRecords({offSetCount : this.offSetCount})
            .then(result => {
                // Returned result if from sobject and can't be extended so objectifying the result to make it extensible
                result = JSON.parse(JSON.stringify(result));
                result.forEach(record => {
                    record.linkAccount = '/' + record.Id;
                });
                this.data = [...this.data, ...result];
                this.mySearchedAccount = [...this.data];
                this.error = undefined;
                this.loadMoreStatus = '';
                if (this.targetDatatable && this.data.length >= this.totalNumberOfRows) {
                    //stop Infinite Loading when threshold is reached
                    this.targetDatatable.enableInfiniteLoading = false;
                    //Display "No more data to load" when threshold is reached
                    this.loadMoreStatus = 'No more data to load';
                }
                //Disable a spinner to signal that data has been loaded
                if (this.targetDatatable) this.targetDatatable.isLoading = false;
            })
            .catch(error => {
                this.error = error;
                this.data = undefined;
                console.log('error : ' + JSON.stringify(this.error));
            });
    }
 
    // Event to handle onloadmore on lightning datatable markup
    handleLoadMore(event) {
        event.preventDefault();
        console.log('handleLoadMore ');
      
        if(this.searchKey.trim().length === 0){
            // increase the offset count by 20 on every loadmore event
        this.offSetCount = this.offSetCount + 100;
        //Display a spinner to signal that data is being loaded
        event.target.isLoading = true;
        //Set the onloadmore event taraget to make it visible to imperative call response to apex.
        this.targetDatatable = event.target;
        //Display "Loading" when more data is being loaded
        this.loadMoreStatus = 'Loading';
        // Get new set of records and append to this.data
        this.getRecords();
        }
       
    }

    handleKeyChange(event) {
        // Debouncing this method: Do not update the reactive property as long as this function is
        // being called within a delay of DELAY. This is to avoid a very large number of Apex method calls.
        console.log('handleKeyChange ');
        
        window.clearTimeout(this.delayTimeout);
        const searchKey = event.target.value;
        if(searchKey){
            this.delayTimeout = setTimeout(() => {
                this.searchKey = searchKey;
                this.inSearch = true;
                this.template.querySelector(
                    '[data-id="table"]'
                  ).selectedRows = [];
                 
                  
               
                const allRecord = [...this.allData];
                const filterdData = allRecord.filter((item)=>{ 
                    return  item['Name'].toLowerCase().indexOf(searchKey.toLowerCase()) !== -1 ? true:false;
                })
                
                this.data = filterdData;
                
                this.template.querySelector('[data-id="table"]' ).selectedRows= this.prevSelctedRows;
                this.inSearch = false;
                
            }, DELAY);
        }else{
          console.log('in else handleKeyChange');
          this.searchKey='';
          const allRecord = [...this.allData];
          const selctedRowIdSet = new Set(this.prevSelctedRows);
          const pevselectRecord = allRecord.filter((record)=>{
                    return (selctedRowIdSet.has(record.Id));
                })
                const pevNotselectRecord = this.mySearchedAccount.filter((record)=>{
                    return (!selctedRowIdSet.has(record.Id));
                })
         
          this.data = [...pevselectRecord,...pevNotselectRecord];
         
          this.template.querySelector('[data-id="table"]' ).selectedRows= this.prevSelctedRows;
         
          
       
        }
        
        
      
    }

    onRowSelection(event){
           // List of selected items from the data table event.
          
           if(!this.inSearch){
           
            let updatedItemsSet = new Set();
            // List of selected items we maintain.
            let selectedItemsSet = new Set(this.allSelectedRows);
            
            // List of items currently loaded for the current view.
            let loadedItemsSet = new Set();
        
           
            this.data.map((event) => {
            
              loadedItemsSet.add(event.Id);
            });
            
           
            if (event.detail.selectedRows) {
                event.detail.selectedRows.map((event) => {
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
           
            this.prevSelctedRows =this.allSelectedRows;
            this.totalSelected = Number(this.allSelectedRows.length);
          
            
           }
          
    }

    
}