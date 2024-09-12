import { LightningElement } from 'lwc';
import { subscribe, unsubscribe } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createMessage from '@salesforce/apex/MessageController.createMessage';
import getAllMessages from '@salesforce/apex/MessageController.getAllMessages';
import getFilteredTickets from '@salesforce/apex/MessageController.getFilteredTickets';
import getAllCompanies from '@salesforce/apex/MessageController.getAllCompanies';

export default class MessageComponent extends LightningElement {
    messageBody = '';
    messages = [];
    selectedCompanyName = '';
    companyOptions = [];
    selectedTicket = '';
    ticketOptions = [];
    ticketPickerDisable = true;
    sendBtnDisable = true;
    isRendered = false;
    ticketId = '';
    subscription = null;

    async connectedCallback() {
        await this.fetchCompanies();
        const eventName = '/event/MessageCreated__e';

        try {
            const response = await subscribe(eventName, -1, (message) => {
                this.ticketId = message.data.payload.MessageTicketId__c;
                if (this.selectedTicket === this.ticketId) {
                    this.loadMessages();
                }
                console.log('Received platform event. Ticket ID: ' + this.ticketId);
            });
            console.log('Subscribed to platform event:', response.channel);
            this.subscription = response;
        } catch (error) {
            console.error('Error subscribing to platform event:', error);
        }
    }

    async disconnectedCallback() {
        if (this.subscription) {
            try {
                const response = await unsubscribe(this.subscription);
                console.log('Unsubscribed from: ', response);
            } catch (error) {
                console.error('Error unsubscribing:', error);
            }
        }
    }

    renderedCallback() {
        if (!this.isRendered) {
            this.scrollToBottom();
            this.isRendered = true;
        }
    }

    async loadMessages() {
        try {
            const result = await getAllMessages({ id: this.selectedTicket });
            console.log(result);
            this.messages = result.map((message) => ({
                id: message.Id,
                body: message.Body__c,
                timestamp: new Date(message.CreatedDate).toLocaleString(),
                type: message.Type__c,
            }));
            this.isRendered = false;
        } catch (error) {
            this.showToast('Error', 'Failed to load messages.', 'error');
            console.error('Error loading messages:', error);
        }
    }

    async fetchCompanies() {
        try {
            const result = await getAllCompanies();
            this.companyOptions = result.map((company) => ({
                label: company.Name,
                value: company.Id,
            }));
        } catch (error) {
            console.error('Error fetching Companies: ', error);
        }
    }

    handleCompanySelect(event) {
        this.messages = [];
        this.selectedCompanyName = event.detail.value;
        if (this.selectedCompanyName) {
            this.fetchTickets();
            this.ticketPickerDisable = false;
        } else {
            this.ticketPickerDisable = true;
        }
    }

    async fetchTickets() {
        if (this.selectedCompanyName) {
            try {
                const data = await getFilteredTickets({ companyId: this.selectedCompanyName });
                this.ticketOptions = data.map((ticket) => ({
                    label: ticket.Name,
                    value: ticket.Id,
                }));
            } catch (error) {
                console.error('Error fetching Tickets: ', error);
            }
        }
    }

    handleTicketSelect(event) {
        this.selectedTicket = event.detail.value;
        console.log(this.selectedTicket);
        if (this.selectedCompanyName && this.selectedTicket) {
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

    async sendMessage() {
        if (this.messageBody.trim() === '') {
            this.showToast('Error', 'Message body cannot be empty.', 'error');
            return;
        }

        try {
            const result = await createMessage({
                messageBody: this.messageBody,
                senderType: 'outcoming',
                ticketId: this.selectedTicket,
            });

            console.log(result);
            this.showToast('Success', 'Message sent successfully!', 'success');
            this.messages.push({
                id: result,
                body: this.messageBody,
                timestamp: new Date().toLocaleString(),
                type: 'outcoming',
            });
            this.messageBody = '';
            this.scrollToBottom();
        } catch (error) {
            this.showToast('Error', 'Failed to send the message.', 'error');
            console.error('Error:', error);
        }
    }

    getMessageClass(message) {
        return `message-item ${message.type}`;
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
