# SimpleSave
Simple &amp; Safe (hopefully!) node.js module for simplifying the use of a MySQL database

NOTE: This is far from done! 

Working:
- Connect/Login
- SELECT
- INSERT
- UPDATE
- DELETE
- EXECUTE
- Multiple connections (might be some bugs)
- Whitelisting of tablenames/fields (INFORMATION_SCHEMA) and operators as an extra anti-measure against injections
- All connections are closed on shutdown(Not sure if this is needed, and might need some fixing)

TODO:
- Use prepared statements, might need to move to mysql2 package?
- Use Promises! Will improve the startup and remove need for the ConnectionSuccess function(and variables)
- Use ES6 shorthand functions/Lamda/whatever it's called
- Use class instead of old js function stuff
- Make sure multiple connections and the closeAll function works correctly, and check if it's necessary
- Write some documentation!
- Write some tests, cause TDD is cool!
- Make a plan, write some specs/goals for a 1.0 version

Long term goals:
- Make it possible to replace the INFORMATION_SCHEMA whitelists with custom ones. Might not always want to expose all available tables/views/fields/procs
- Possibility for other databases, Postgres, SQL Server, SQLite? Would be nice to have a common lib with "SimpleSave_DBType" sub-packages
