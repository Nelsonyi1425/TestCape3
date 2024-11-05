import { LightningElement, wire, api, track } from 'lwc';
import getOpportunitiesByAccountId from '@salesforce/apex/OpportunityController.getOpportunitiesByAccountId';
import deleteOpportunity from '@salesforce/apex/OpportunityController.deleteOpportunity';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class OpportunityList extends LightningElement {
    @api recordId; 
    @track opportunities = [];
    @track error;
    @track isLoading = true;
    @track currentPage = 1;
    @track recordsPerPage = 5;
    wiredOpportunitiesResult;

    columns = [
        { label: 'Opportunity Name', fieldName: 'Name', type: 'text' },
        { label: 'Stage', fieldName: 'StageName', type: 'text' },
        { label: 'Amount', fieldName: 'Amount', type: 'currency' },
        { type: 'action', typeAttributes: { rowActions: this.getRowActions } }
    ];

    getRowActions(row, doneCallback) {
        const actions = [
            { label: 'Edit', name: 'edit' },
            { label: 'Delete', name: 'delete' },
            { label: 'Change Owner', name: 'change_owner' }
        ];
        doneCallback(actions);
    }

    @wire(getOpportunitiesByAccountId, { accountId: '$recordId' })
    wiredOpportunities(result) {
        this.wiredOpportunitiesResult = result; // Save result for refresh
        const { error, data } = result;
        this.isLoading = false;
        if (data) {
            this.opportunities = data;
            this.error = undefined;
            this.currentPage = 1; 
        } else if (error) {
            this.error = error.body.message;
            this.opportunities = [];
        }
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'edit':
                this.editOpportunity(row.Id);
                break;
            case 'delete':
                this.deleteOpportunity(row.Id);
                break;
            default:
        }
    }

    editOpportunity(id) {
        const editUrl = `/lightning/r/Opportunity/${id}/edit`;
        window.open(editUrl, '_self');
    }

    deleteOpportunity(id) {
        deleteOpportunity({ opportunityId: id })
            .then(() => {
                this.showToast('Success', 'Opportunity deleted', 'success');
                return refreshApex(this.wiredOpportunitiesResult); // Refresh data
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(evt);
    }
     get pagedOpportunities() {
        const start = (this.currentPage - 1) * this.recordsPerPage;
        return this.opportunities.slice(start, start + this.recordsPerPage);
    }

    get recordCount() {
        return this.opportunities.length;
    }

    get totalPages() {
        return Math.ceil(this.recordCount / this.recordsPerPage);
    }

    get isFirstPage() {
        return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage >= this.totalPages;
    }

    handlePrevious() {
        if (!this.isFirstPage) {
            this.currentPage -= 1;
        }
    }

    handleNext() {
        if (!this.isLastPage) {
            this.currentPage += 1;
        }
    }
}