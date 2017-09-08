// Used to run size calculations in a separate process.
require('../index')(process.argv.slice(2))
  .then(stats => process.stdout.write(JSON.stringify(stats)))
  .catch(error => process.stderr.write(error.message))
