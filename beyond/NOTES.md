Req.request
  service: 'subscribe'
  resource: {roomId: 'elm'}
  onSuccess: {type: 'subData', result: Req.__}
  onError: {type: 'subError', error: Req.__}

These just get batched together and they persist between updates. Using JsonDiffPatch we can sync the subscriptions between the client and server. The server just looks at all the resources and makes sure the appropriate listeners are attached. If there are any new resources, it will run the query, and if there are any removed resources, those will be cleaned up.

Now suppose we have the same queries with different paging offsets? Do they merge together? How do you separate them back out on the client again? How about different fields?

Req.consume needs to consume the child request within the parent request if possible likst graphql. How do you specify if and how these queries can be consumed?

domain:
  query: {}
  fields: 
    name: true
    name: true
    domain:
      query: {}
      fields:


chatroom:
  query: {roomId: 'elm'}
  fields:
    name: true
    message:
      query: {limit: 20}
      fields:
        createdAt: true
        user:
          fields:
            name: true

create some kind of model of the data to traverse based on this query structure to run the appropriate query
create a mutation query which speicifies which queries need to be re-run, and filter/diff queries to re-run the associated queries

Req.fragment

problematic cases:
- what if we have two queries for the same chatroom with different limits? how do we separate those queries while making sure not to send the same data twice? -- use jsondiffpatch based on document id just like meteor

how would this work for shindig?
Neo4j or datomic?