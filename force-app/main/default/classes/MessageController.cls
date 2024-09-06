public with sharing class MessageController {
    @AuraEnabled
    public static Id createMessage(String messageBody, String senderType, String ticketId) {
        Message__c message = new Message__c();
        message.Body__c = messageBody;
        message.Type__c = senderType;
        message.Ticket__c = ticketId;
        insert message;
        return message.Id;
    }

    @AuraEnabled
    public static List<Message__c> getAllMessages(String Id) {
        return [SELECT Id, Body__c, CreatedDate FROM Message__c WHERE Ticket__c = :Id ORDER BY CreatedDate ASC];
    }

    @AuraEnabled
    public static List<Ticket__c> getFilteredTickets(String companyId) {
        return [SELECT Id, Name FROM Ticket__c WHERE Company__c = :companyId ORDER BY Name];
    }

    @AuraEnabled
    public static List<Company__c> getAllCompanies() {
        return [SELECT Id, Name FROM Company__c ORDER BY Name];
    }
}
