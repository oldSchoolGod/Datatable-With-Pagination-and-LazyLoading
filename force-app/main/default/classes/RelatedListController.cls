public class RelatedListController {
    
    @AuraEnabled(cacheable=true)
    public static List<Account> findAccount() {
      
      List<Account> accList = [SELECT Id, Name, AccountNumber, CreatedDate FROM Account];
        System.debug('accList '+accList);
        return accList;
      
    }
    
    @AuraEnabled
    public static List<Account> getRecords(Integer offSetCount) {
        return [SELECT Id, Name, AccountNumber, CreatedDate FROM Account LIMIT 100 OFFSET :offSetCount];
    }
}