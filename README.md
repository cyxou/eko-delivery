```
CREATE INDEX ON :Town(name)
```

```
LOAD CSV WITH HEADERS FROM "file:///sample-data.csv" AS csvLine
MERGE (from:Town {name: csvLine.from})
MERGE (to:Town {name: csvLine.to})
CREATE (from)-[:ROUTE {cost: toInt(csvLine.cost)}]->(to)
```

## Cases

### Case 1
Calculate the delivery cost of the given delivery route.

Follow the route as given; do not count any extra stops.
In case given route is not exists, output ’No Such Route’

| Input                                |    Output      |
---------------------------------------------------------
| The delivery cost for route  A-B-E   |       4        |
| The delivery cost for route  A-D     |       10       |
| The delivery cost for route  E-A-C-F |       8        |
| The delivery cost for route  A-D-F   | No Such Route  |

```
MATCH p = (t1)-[]->(t2)-[]->(t3)
WHERE t1.name = 'A' AND t2.name = 'B' AND t3.name = 'E'
WITH reduce(total = 0, x in relationships(p)| total + x.cost) as cost
RETURN cost

MATCH p = (t1)-[]->(t2)
WHERE t1.name = 'A' AND t2.name = 'D'
WITH reduce(total = 0, x in relationships(p)| total + x.cost) as cost
RETURN cost

MATCH p = (t1)-[]->(t2)-[]->(t3)-[]->(t4)
WHERE t1.name = 'E' AND t2.name = 'A' AND t3.name = 'C' AND t4.name = 'F'
WITH reduce(total = 0, x in relationships(p)| total + x.cost) as cost
RETURN cost

MATCH p = (t1)-[]->(t2)-[]->(t3)
WHERE t1.name = 'A' AND t2.name = 'D' AND t3.name = 'F'
WITH reduce(total = 0, x in relationships(p)| total + x.cost) as cost
RETURN cost

MATCH p = (t1)-[]->(t2)-[]->(t3)
WHERE t1.name = 'A' AND t2.name = 'D' AND t3.name = 'F'
UNWIND
   CASE
      WHEN p = []
         THEN ['No Such Route']
      ELSE reduce(total = 0, x in relationships(p)| total + x.cost)
   END AS cost
RETURN cost
```

### Case 2
Calculate the number of possible delivery route that can be construct by the
given conditions. ( Do not count the route that has 0 cost )

| Input                                                           | Output |
----------------------------------------------------------------------------
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

```
MATCH p = (t1)-[r*..4]->(t2)
WHERE t1.name = 'E' AND t2.name = 'D'
RETURN count(p)

???????
MATCH p = (t1)-[r*]->(t2)
WHERE t1.name = 'E' AND t2.name = 'E'
RETURN count(p)


MATCH p = (t1)-[r*]->(t2)
WHERE t1.name = 'E' AND t2.name = 'E'
RETURN count(p),
	reduce(total = 0, x in relationships(p)| total + x.cost) as cost
ORDER BY cost ASC
LIMIT 100;

```




### Case 3
Calculate the cheapest delivery route between two towns

| Input                                               | Output |
----------------------------------------------------------------
| The cost of cheapest delivery route between E to D  |   9    |
| The cost of cheapest delivery route between E to E  |   6    |


```
MATCH p = (t1)-[r*..]->(t2)
WHERE t1.name = 'E' AND t2.name = 'D'
WITH reduce(total = 0, x in relationships(p) | total + x.cost) as cheapestCost
RETURN cheapestCost,p
ORDER BY cheapestCost ASC
LIMIT 1

MATCH (:Town {name: 'E'})-[routes*]->(:Town {name: 'D'})
WITH reduce(d=0, r in routes | d + r.cost) as cheapestCost
RETURN cheapestCost
ORDER BY cheapestCost ASC
LIMIT 1
```

## TODO
 - Make populate-db command idempotent (should not create new nodes and
     relationships if called multiple times)
