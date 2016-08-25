
// helper function for generating nodes. value is optional and should be an
// object and children should be an array.
export default function node(value, children) {
  if (Array.isArray(value)) {
    children = value
    value = undefined
  } else if (!Array.isArray(children)) {
    children = []
  }
  return {
    __type: 'node',
    value,
    children,
  }
}

