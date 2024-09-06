// Ticket__c obj = new Ticket__c();

// List<Message__c> recordsToDelete = [SELECT Id FROM Message__c LIMIT 10000]; // Adjust the object name
// delete recordsToDelete;


// List<Company__c> companys = new List<Company__c>();

// for (Integer i = 0; i < 20; i++) {
//   Company__c company = new Company__c(Name = 'New company' + i);
//   companys.add(company);
// }

// insert companys;

// List<Ticket__c> companys = new List<Ticket__c>();

// List<Company__c> id = [SELECT Id FROM Company__c WHERE Name = 'New company10'];

// for (Integer i = 0; i < 5; i++) {
//   Ticket__c newt = new Ticket__c(Name = 'New ticket ' + i, Company__c = id[0].Id);
//   companys.add(newt);
// }

// insert companys;

List<Message__c> companys = new List<Message__c>();

for (Integer i = 0; i < 5; i++) {
  Message__c newt = new Message__c(Name = 'New ticket ' + i, Company__c = id[0].Id, Type);
  companys.add(newt);
}

insert companys;

