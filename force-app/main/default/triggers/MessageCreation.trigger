trigger MessageCreation on Message__c (after insert) {
  List<MessageCreated__e> eventList = new List<MessageCreated__e>();

  for (Message__c mes : Trigger.New) {
      MessageCreated__e event = new MessageCreated__e(
        MessageTicketId__c = mes.Ticket__c
      );
      System.debug(mes.Ticket__c);
      eventList.add(event);
  }

  if (eventList.size() > 0) {
      List<Database.SaveResult> results = EventBus.publish(eventList);
      for (Database.SaveResult sr : results) {
          if (!sr.isSuccess()) {
              System.debug('Error publishing event: ' + sr.getErrors()[0].getMessage());
          }
          if (sr.isSuccess()) {
            System.debug('Events were published!!!');
          }
      }
  }
}
