Requests and GraphQl are the same if the queries are simply deep-merged. But we need to think about what queries ought to look like.

- what are the queries involved with some typical apps
- what kind of reactivity might we expect?

chatroom example

getChatrooms({limit, offset, name})
getMessages({roomId, userId, text, limit, offset})

setNewChatroom({name})
  - refesh.getChatrooms({name: matches(name)})
setNewMessage(roomId, text)
  - refresh.getMessages({roomId: eq(roomId), text: matches(text)})

shindig example

getEvents({feed, popular, time, place, title, limit, offset})
getUsers({followers, following, stagazers, commonStargazers, name})

setNewEvent(title, time, place, userId)
  - refresh.getEvents({
      feed: eqOneOf(getUsers({followers: userId}).concat(userId)),
      time: soonAfter(time),
      place: near(place),
      title: matches(title)
    })
setNewStar(eventId, userId)
  - refresh.getEvents({id: eventId})
  - refresh.getEvents({feed: )
setNewFollow(userId, followId)


- what about edge counts?
- how can we organize the query and results information

getEvents({feed, popular, time, place, title, limit, offset})

events(feed:userId, time:12/28/15) {
  id,
  stargazerCount,
  stargazers {
    id
  },
  commonStargazerCount,
  admins(limit: 10, offset: 0){
    id,
    followers(userId: userId) {
      id
    }
  }
}

graph computations can be quite complex
- how do you deal with paging, edge counts

graphql is tricky as you start to have fields that want to take arguments

this is all going to come down to building query reducers so we can appropriately merge resource requests.

services define some kind of type along with a reducer which is basically just the concat method. Do queries merge and how? we need to think hard about how queries are constructed.

Req.request
  service: 'subscribe'
  resource: {
    node: 'chatrooms'
    query: {limit: 10, offset: 0, name: ''}
    edges: [
      'id'
      'name'
      'createdAt'
      {owner: {}}
    ]
  }

getChatrooms({limit, offset, name})
getMessages({roomId, userId, text, limit, offset})

setNewChatroom({name})
  - refesh.getChatrooms({name: matches(name)})
setNewMessage(roomId, text)
  - refresh.getMessages({roomId: eq(roomId), text: matches(text)})

The problem here is coming up with THE BEST query language / query formatting ever. And it must cover all edge cases. Huge pain in the ass.

The crucial things:
- domain/query and query reducers
- type/node
- fields, fields that take args (singular edge), and edges

['chatrooms', {limit, offset, name}, fields: ['id', 'name', 'createdAt', ['owner', ['id', 'name', 'messageCount']]]]



- So we're using grapql. How do we specify fragments and how they merge? How do we run these giant queries as efficiently as possible? How do the reactive queries work?

chatrooms({limit, offset, name}) {
  id,
  name,
  createdAt,
  owner {
    id,
    name,
    messageCount
  },
  messages {
    id,
    text,
    createdAt,
    owner {
      id,
      name,
      messageCount,  
      // potentially nest even further    
    }
  }
}

we need a set of rules for reducing different kinds of fields.
we need a set of methods for composing Neo4j queries.

getChatrooms = ({limit, offset, name}) ->
  MATCH (c:CHATROOM {name: regex(name)})

  MATCH (c)-[:OWNED_BY]->(u)


  RETURN c.id, c.name, c.createdAt,
  LIMIT limit
  OFFSET offset


Can I get a graphql response from neo4j? can I put that edge inline to get a list of chatrooms with a list of their messages along with their owners?

How would you implement caching and reactivity?
Would reactive queries just be fragments or what?

How do you compose all of these things nicely?


functional programming and immutablility to the rescue...?

caching and id lookup happens at the protocol interface level. out of the streams comes exactly what we put in. using immutable.js we can have shared data-structures and everything is good.

the big benefit of this over the existing any-db any-store architecture is we can consolidate all out queries and merge them together. this means we far fewer requests. And rather than have tons of watchers, we can simply filter through the query space to refresh whatever needs to.


things to think about for next time
- query structure
- resulting data structure
- reactive query structure
- caching / efficient filtering structures
- consistency between owner and user, etc.

if we describe all of this via algebraic structure, then we win. everything will be amazing.











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
