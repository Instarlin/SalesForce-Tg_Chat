public with sharing class MessageController {
    @AuraEnabled
    public static Id createMessage(String messageBody, String senderType, String ticketId) {
        if (senderType == 'outcoming') {
            sendMessage(messageBody, ticketId);            
        }
        Message__c message = new Message__c();
        message.Body__c = messageBody;
        message.Type__c = senderType;
        message.Ticket__c = ticketId;
        insert message;
        return message.Id;
    }

    @future(callout=true)
    public static void sendMessage(String messageBody, String ticketId) {
        Map<String, Object> data = new Map<String,Object>();
        data.put('id', ticketId);
        data.put('message', messageBody);

        String jsonData = JSON.serialize(data);

        HttpRequest req = new HttpRequest();
        req.setEndpoint('http://185.195.26.101:8000');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(jsonData);
        req.setMethod('POST');

        Http http = new Http();
        try {
            HttpResponse res = http.send(req);
            if (res.getStatusCode() == 200) {
                System.debug('Data sent successfully: ' + res.getBody());
            } else {
                System.debug('Failed to send data: ' + res.getStatusCode());
            }
        } catch (Exception e) {
            System.debug(e);
        }
    }

    @AuraEnabled
    public static List<Message__c> getAllMessages(String id) {
        return [SELECT Id, Body__c, CreatedDate, Type__c FROM Message__c WHERE Ticket__c = :id ORDER BY CreatedDate ASC];
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
