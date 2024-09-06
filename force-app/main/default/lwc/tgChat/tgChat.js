import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createMessage from '@salesforce/apex/MessageController.createMessage';
import getAllMessages from '@salesforce/apex/MessageController.getAllMessages';
import getFilteredTickets from '@salesforce/apex/MessageController.getFilteredTickets';
import getAllCompanies from '@salesforce/apex/MessageController.getAllCompanies';


export default class MessageComponent extends LightningElement {
    @track messageBody = '';
    @track messages = [];
    @track selectedCompanyName = '';
    @track companyOptions = [];
    @track selectedTicket = '';
    @track ticketOptions = [];
    @track ticketPickerDisable = true;
    @track sendBtnDisable = true;
    isRendered = false;

    connectedCallback() {
        this.fetchCompanies();
    }

    renderedCallback() {
        if (!this.isRendered) {
            this.scrollToBottom();
            this.isRendered = true;
        }
    }

    loadMessages() {
        getAllMessages({Id: this.selectedTicket})
            .then(result => {
                this.messages = result.map(message => {
                    return {
                        id: message.Id,
                        body: message.Body__c,
                        timestamp: new Date(message.CreatedDate).toLocaleString()
                    };
                });
                this.isRendered = false;
            }).catch(error => {
                this.showToast('Error', 'Failed to load messages.', 'error');
                console.error('Error loading messages:', error);
            });
    }

    fetchCompanies() {
        getAllCompanies().then(result => {
            this.companyOptions = result.map(company => {
                return {
                    label: company.Name,
                    value: company.Id
                };
            });
        }).catch(error => {
            console.error('Error fetching Companies: ', error);
        })
    }

    handleCompanySelect(event) {
        this.selectedCompanyName = event.detail.value;
        console.log(this.selectedCompanyName);
        if(this.selectedCompanyName) {
            this.fetchTickets();
            this.ticketPickerDisable = false;
        } else this.ticketPickerDisable = true;
    }

    fetchTickets() {
        if (this.selectedCompanyName) {
            getFilteredTickets({ companyId: this.selectedCompanyName }).then(data => {
                this.ticketOptions = data.map(ticket => {
                    return { 
                        label: ticket.Name,
                        value: ticket.Id
                    };
                });
            }).catch(error => {
                console.error('Error fetching Tickets: ', error);
            });
        }
    }

    hadnleTicketSelect(event) {
        this.selectedTicket = event.detail.value;
        console.log(this.selectedTicket);
        if(this.selectedCompanyName && this.selectedTicket) {
            this.loadMessages();
            this.sendBtnDisable = false;
        } else {
            this.messages = [];
            this.sendBtnDisable = true;
        }
    }

    handleInputChange(event) {
        this.messageBody = event.target.value;
    }

    sendMessage() {
        if (this.messageBody.trim() === '') {
            this.showToast('Error', 'Message body cannot be empty.', 'error');
            return;
        }

        createMessage({ messageBody: this.messageBody, senderType: 'outcoming', ticketId: this.selectedTicket }).then(result => {
            this.showToast('Success', 'Message sent successfully!', 'success');
            this.messages.push({
                id: result,
                body: this.messageBody,
                timestamp: new Date().toLocaleString(),
                type: 'outcoming'
            });
            this.messageBody = '';
            this.scrollToBottom();
        }).catch(error => {
            this.showToast('Error', 'Failed to send the message.', 'error');
            console.error('Error:', error);
        });
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            const messageList = this.template.querySelector('.messages-list');
            if (messageList) {
                messageList.scrollTop = messageList.scrollHeight;
            }
        });
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }
}
