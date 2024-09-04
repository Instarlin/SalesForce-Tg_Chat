public with sharing class MessageController {
    @AuraEnabled
    public static Id createMessage(String messageBody, String senderType) {
        Message__c message = new Message__c();
        message.Body__c = messageBody;
        message.Type__c = senderType; 
        insert message;
        return message.Id;
    }

    @AuraEnabled(cacheable=true)
    public static List<Message__c> getAllMessages() {
        return [SELECT Id, Body__c, CreatedDate FROM Message__c ORDER BY CreatedDate ASC];
    }
}
