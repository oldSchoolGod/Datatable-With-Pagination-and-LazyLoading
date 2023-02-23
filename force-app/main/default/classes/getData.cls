public class getData {
    
   /* @AuraEnabled(cacheable=true)
   public static List<Opportunity> getOppss( ) {
     List<Opportunity> oppList = [SELECT Id, Name, StageName, Amount, LeadSource FROM Opportunity LIMIT 50];
       System.debug('oppList '+oppList);
       return oppList;
   }*/
    @AuraEnabled(cacheable=true)
   public static List<Opportunity> getOpps( String searchKey, String sortBy,String sortDirection) {
      
       String query = 'SELECT Id, Name,StageName,CloseDate FROM Opportunity';
       system.debug('query---'+query);
       if ( searchKey != null && searchKey != '' ) {
           String key = '%' + searchKey + '%';
           query += ' WHERE Name LIKE :key';
       }
       if ( sortBy != null && sortDirection != null ) {
           query += ' ORDER BY ' + sortBy + ' ' + sortDirection;
       }
       query = query ;
       return Database.query( query );
   }

}