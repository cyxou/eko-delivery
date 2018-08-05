# Eko Delivery Service App

To help Eko provide the best service to it's customers, the Eko Delivery App was
implemented which is a console application that makes request to Neo4j graph
database for delivery routes calculations.

To use Eko Delivery Service, their customers have to define the delivery route
by themselves.
They can construct it by choosing multiple routes between two towns that Eko
provided.
The delivery cost is equal to the summation of these routes that they chose.
Each routes in the list is only ‘one-way’, That is, a route from town A to town B
does not imply the existence of a route from town B to town A. Even if both of these
routes do exist, they are distinct and are not necessarily have the same cost.

## Prerequisites

  - NodeJS
  - Docker
  - docker-compose

In order to use this app, you need to have Neo4j server installed locally or in a
Docker container, which is preferred. If you don't have Docker installed, than
it's finally the right time to [do it](https://www.docker.com/community-edition).
After you have Docker installed, also [install docker-compose](https://docs.docker.com/compose/install/)
for a smooth development experience.

You also need to [install NodeJS](https://nodejs.org/en/download/) and npm
dependencies for app to work.
The app was developed with the latest NodeJS version which at the moment was v10.7.0,
but it should work well with v8.11.3 though wasn't tested extensively.

Open your terminal and navigate to the ./eko-delivery folder then run:

```sh
npm install && npm link
```
This will install npm dependencies and link `eko-delivery` app so that it is
available in your shell just like any other console app.

## Usage

Before interacting with the app, you need to launch Neo4j server and populate
it with sample data.
Open your terminal, navigate to the root of this project and run

```sh
docker-compose up -d
```

Docker will firstly download the specified in the docker-compose.yaml Neo4j image
and then run a corresponding container. The `-d` switch will make docker run in
the background, leaving your terminal for you to hack on the app. At this
point you may open your browser at [http://localhost:7474/browser](http://localhost:7474/browser/)
if you are on Linux or Windows and play with Neo4j, though it's not necessary for
using this app. If you are on Mac, then obtain the IP address of your docker host
with the `docker-machine ip` command and substitute 'localhost' with it.

You may also run Neo4j container with this command (Linux and Mac only):

```sh
docker run --rm \
  --publish=7474:7474 --publish=7687:7687 \
  --volume=$(pwd)/neo4j/data:/data \
  --volume=$(pwd)/neo4j/import:/import \
  --env NEO4J_AUTH=none \
  neo4j:3.4.5
```

At this point the Eko Delivery Service app should be ready to work. In your
terminal run

```sh
eko-delivery
```

An interactive prompt session will start helping you to decide what to do.
But before calculating any routes and costs, you should populate database with
sample data from the __./neo4j/import/sample-data.csv__ file. To do this, select
the corresponding option in the eko-delivery prompt.

Once the database is populated, you may start making queries to it by
interacting with different app options which correspond to the cases described
below. You may also observe the imported graph in Neo4j browser at [http://localhost:7474/browser](http://localhost:7474/browser/).


## Calculation cases

### Case 1
Calculate the delivery cost of the given delivery route.

Follow the route as given; do not count any extra stops.
In case given route is not exists, output ’No Such Route’

| Input                                |    Output      |
|--------------------------------------|----------------|
| The delivery cost for route  A-B-E   |       4        |
| The delivery cost for route  A-D     |       10       |
| The delivery cost for route  E-A-C-F |       8        |
| The delivery cost for route  A-D-F   | No Such Route  |


### Case 2
Calculate the number of possible delivery routes that can be construct by the
given conditions. ( Do not count the route that has 0 cost )

| Input                                                           | Output |
|-----------------------------------------------------------------|--------|
| The number of possible delivery route from E to D with a        |   4    |
| maximum of 4 stop without using the same route twice in a       |        |
| delivery route                                                  |        |
|                                                                 |        |
| The number of possible delivery route from E to E without using |   5    |
| the same route twice in a delivery route                        |        |
|                                                                 |        |
| **Bonus**: the number of possible delivery routes from E to E   |   29   |
| that delivery cost is less than 20. Given that the same route   |        |
| can be used twice in a delivery route                           |        |

**The route reuse option is not implemented at the moment. Some more knowledge of
Neo4j cypher language is needed.** Because of this, the second and the third
examples of Case 2 return results different from the provided in the table as
eko-delivery does not restrict on using the same routes twice.


### Case 3
Calculate the cheapest delivery route between two towns

| Input                                               | Output |
|-----------------------------------------------------|--------|
| The cost of cheapest delivery route between E to D  |   9    |
| The cost of cheapest delivery route between E to E  |   6    |

## Configuration
#### Neo4j server
eko-delivery app configured to use Neo4j server running locally, hence the `bolt://localhost:7474` 
uri in the config file . If the uri of your Neo4j server differs from it, use confiruration option of the eko-delivery app to set it right.

### Sample data
You may provide your own file for database population. Just put it into the ./neo4j/import folder and set its name in eko-delivery confiruration.

## TODO
 - Implement option to no allow same route to be used twice.
 - Add routes graphs to responses where appropriate.
 - Make populate-db command idempotent (should not create new nodes and
     relationships if called multiple times).
