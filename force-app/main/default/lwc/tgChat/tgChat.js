import { LightningElement } from 'lwc';
import { subscribe, unsubscribe } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createMessage from '@salesforce/apex/MessageController.createMessage';
import getAllMessages from '@salesforce/apex/MessageController.getAllMessages';
import getFilteredTickets from '@salesforce/apex/MessageController.getFilteredTickets';
import getAllCompanies from '@salesforce/apex/MessageController.getAllCompanies';

const MESSAGE_CREATED_EVENT = '/event/MessageCreated__e';

export default class MessageComponent extends LightningElement {
    messageBody = '';
    messages = [];
    notifications = [];
    selectedCompanyId = '';
    companyOptions = [];
    selectedTicketId = '';
    ticketOptions = [];
    isTicketPickerDisabled = true;
    isSendBtnDisabled = true;
    subscription = null;

    async connectedCallback() {
        this.subscribeToMessageEvents();
        await this.fetchCompanies();
    }

    async disconnectedCallback() {
        if (this.subscription) {
            try {
                const response = await unsubscribe(this.subscription);
                console.log('Unsubscribed from:', response);
            } catch (error) {
                console.error('Error unsubscribing:', error);
            }
        }
    }

    subscribeToMessageEvents() {
        subscribe(MESSAGE_CREATED_EVENT, -1, (message) => {
            const receivedTicketId = message.data.payload.MessageTicketId__c;
            if (this.selectedTicketId === receivedTicketId) {
                this.loadMessages();
            } else {
                this.notifications.push({
                    id: message.data.payload.MessageTicketId__c,
                    value: message.data.payload.MessageName__c,
                    timestamp: new Date(message.data.payload.CreatedDate).toLocaleString(),
                });
                console.log(this.notifications);
                this.showToast('Новое сообщение', `У вас новое сообщение в чате: ${message.data.payload.MessageName__c}`, 'info');
            };
            // console.log('Received platform event. Ticket ID:', receivedTicketId);
        })
            .then((response) => {
                console.log('Subscribed to platform event:', response.channel);
                this.subscription = response;
            })
            .catch((error) => {
                console.error('Error subscribing to platform event:', error);
            });
    }

    async fetchCompanies() {
        try {
            const result = await getAllCompanies();
            this.companyOptions = result.map((company) => ({
                label: company.Name,
                value: company.Id,
            }));
        } catch (error) {
            console.error('Error fetching companies:', error);
            this.showToast('Error', 'Failed to fetch companies.', 'error');
        }
    }

    handleCompanySelect(event) {
        this.messages = [];
        this.selectedCompanyId = event.detail.value;
        if (this.selectedCompanyId) {
            this.fetchTicketsForCompany();
            this.isTicketPickerDisabled = false;
            this.isSendBtnDisabled = true;
            this.selectedTicketId = '';
        } else {
            this.isTicketPickerDisabled = true;
            this.ticketOptions = [];
        }
    }

    async fetchTicketsForCompany() {
        try {
            const data = await getFilteredTickets({ companyId: this.selectedCompanyId });
            this.ticketOptions = data.map((ticket) => ({
                label: ticket.Name,
                value: ticket.Id,
            }));
            console.log(data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            this.showToast('Error', 'Failed to fetch tickets.', 'error');
        }
    }

    handleTicketSelect(event) {
        this.selectedTicketId = event.target.dataset.ticketId;
        console.log(this.selectedTicketId);
        if (this.selectedCompanyId && this.selectedTicketId) {
            this.loadMessages();
            this.isSendBtnDisabled = false;
        } else {
            this.messages = [];
            this.isSendBtnDisabled = true;
        }
    }

    async loadMessages() {
        try {
            const result = await getAllMessages({ id: this.selectedTicketId });
            this.messages = result.map((message) => ({
                id: message.Id,
                body: message.Body__c,
                timestamp: new Date(message.CreatedDate).toLocaleString(),
                type: message.Type__c,
            }));
            this.scrollToBottom();
        } catch (error) {
            this.showToast('Error', 'Failed to load messages.', 'error');
            console.error('Error loading messages:', error);
        }
    }

    handleInputChange(event) {
        this.messageBody = event.target.value;
    }

    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
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
                ticketId: this.selectedTicketId,
            });

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
            console.error('Error sending message:', error);
        }
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
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant,
            })
        );
    }
}
