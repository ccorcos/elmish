// components query and commit to the database
// what is the database is a stream
// we have a series of filters which is our query

const Counter = run([
  commit({
    tag: 'state',
    name: 'counter',
    value: 0,
  }),
  match({tag: 'state', name: 'counter'})
  .bind(({value}) => ({
    tag: 'html',
    name: 'counter'
    html: (
      <div>
        <span>{value}</span>
        <button onClick={event({name: 'increment'})}>inc</button>
      </div>
    )
  })),
  match({tag: 'event', name: 'increment'})
  .chain(() =>
    match({tag: 'state', name: 'counter'})
    .bind(({value}) => ({
      tag: 'state',
      name: 'counter',
      value: value + 1,
    }))
  )
])

// map over the queries so all the functions know what their context is.
