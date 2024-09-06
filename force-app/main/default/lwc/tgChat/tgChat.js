import { LightningElement, track, wire } from 'lwc';
import createMessage from '@salesforce/apex/MessageController.createMessage';
import getAllMessages from '@salesforce/apex/MessageController.getAllMessages';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class MessageComponent extends LightningElement {
    @track messageBody = '';
    @track messages = [];
    @track selectedCompanyName = '';
    @track selectedTicket = '';
    @track ticketPickerEnable = true;
    isRendered = false;

    connectedCallback() {
        this.loadMessages();
    }

    renderedCallback() {
        if (!this.isRendered) {
            this.scrollToBottom();
            this.isRendered = true;
        }
    }

    loadMessages() {
        getAllMessages()
            .then(result => {
                this.messages = result.map(message => {
                    return {
                        id: message.Id,
                        body: message.Body__c,
                        timestamp: new Date(message.CreatedDate).toLocaleString()
                    };
                });
                this.isRendered = false;
            })
            .catch(error => {
                this.showToast('Error', 'Failed to load messages.', 'error');
                console.error('Error loading messages:', error);
            });
    }

    handleCompanySelect(event) {
        this.selectedCompanyName = event.detail.recordId;
        if(this.selectedCompanyName) this.ticketPickerEnable = false;
        else this.ticketPickerEnable = true;
    }

    hadnleTicketSelect(event) {
        console.log(event);
        this.selectedTicket = event.detail.recordId;
        if(this.selectedCompanyName && this.selectedTicket) {
            this.loadMessages();
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

        createMessage({ messageBody: this.messageBody, senderType: 'outcoming', owner: this })
            .then(result => {
                this.showToast('Success', 'Message sent successfully!', 'success');
                this.messages.push({
                    id: result,
                    body: this.messageBody,
                    timestamp: new Date().toLocaleString(),
                    type: 'outcoming'
                });
                this.messageBody = '';
                this.scrollToBottom();
            })
            .catch(error => {
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
