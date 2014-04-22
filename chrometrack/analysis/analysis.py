import pymongo
from pymongo import MongoClient

client = MongoClient("localhost", 3001)
db = client.meteor

def isCleanDomain(domain):
  if domain == '': return True
  domainEntry = db.domains.find_one({'_id': domain})
  marker = None
  if domainEntry is not None: 
    marker = domainEntry['marker'] if domainEntry.has_key('marker') else None;
    return marker;
  db.domains.insert({'_id': domain})
  return marker;

def cleanRequest(req):
  #print "Cleaning Request"
  #print req
  try:
    url_domain = req['parsedURL']['host'];
    url_marker = isCleanDomain(url_domain);
  except KeyError:
    #raise
    url_domain = ''
    url_marker = None
  try:
    parent_domain = req['parentURL']['host']
    parent_marker = isCleanDomain(parent_domain)
  except KeyError:
    parent_domain = ''
    parent_marker = None
  cross_domain = False if url_domain == parent_domain else True
  print "url_domain: "+url_domain+", "+str(url_marker)+" parent_domain: "+parent_domain+", "+str(parent_marker)
  db.requests.update({'_id': req['_id']}, {"$set": {'parentURL.domain_marker': parent_marker, 'parsedURL.domain_marker': url_marker, 'cross_domain': cross_domain}})

  

i = 0;
for req in db.requests.find():
  # Performing analysis on request
  i = i + 1
  cleanRequest(req)
  #if i > 5: break;
