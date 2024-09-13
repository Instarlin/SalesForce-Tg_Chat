trigger MessageCreation on Message__c (after insert) {
  List<MessageCreated__e> eventList = new List<MessageCreated__e>();

  Set<Id> ticketIds = new Set<Id>();
  for (Message__c mes : Trigger.New) {
    if (mes.Ticket__c != null) {
      ticketIds.add(mes.Ticket__c);
    }
  }

  Map<Id, Ticket__c> ticketMap = new Map<Id, Ticket__c>([
    SELECT Id, Name
    FROM Ticket__c
    WHERE Id IN :ticketIds
  ]);

  for (Message__c mes : Trigger.New) {
    MessageCreated__e event = new MessageCreated__e(
      MessageTicketId__c = mes.Ticket__c,
      MessageName__c = ticketMap.get(mes.Ticket__c) != null ? ticketMap.get(mes.Ticket__c).Name : null
    );
    eventList.add(event);
  }

  if (eventList.size() > 0) {
    List<Database.SaveResult> results = EventBus.publish(eventList);
    for (Database.SaveResult sr : results) {
      if (!sr.isSuccess()) {
        System.debug('Error publishing event: ' + sr.getErrors()[0].getMessage());
      }
    }
  }
}
