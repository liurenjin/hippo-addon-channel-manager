# Build
Build with testing:

    $ mvn clean install

Build without testing:

    $ mvn clean install -DskipTests

Build with snapshot dependencies:

    $ mvn clean install -Dhippo.snapshots

    $ mvn clean install "-Dhippo.snapshots" //WINDOWS USERS

 Note: only needed when the project refers to SNAPSHOT dependencies!

 Note: only effective when your Maven settings.xml file contains a profile
       with this property for the Hippo snapshot repository. For details, see
       http://www.onehippo.org/library/development/build-hippo-cms-from-scratch.html

# Development of AngularJS code

1. Compile channel manager with JRebel


    $ mvn clean install -Djrebel

2. Start up your project with JRebel and wicket development mode enabled


    $ cd <your project>
    $ mvn -Pcargo.run -Dcargo.jvm.args='-Dwicket.configuration=development' -Djrebel

3. Start up frontend build system in angularjs-api or frontend module


    $ npm start

# Useful commands to run
The following commands can be run from either the angularjs-api or frontend module
### Run unit tests

    $ npm test

### Build application for development

    $ npm run build

### Serve and watch files for development

    $ npm start

