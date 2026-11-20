# Weights
These are the weights used to determine which event occurs (GATE itself, or things within an GATE event).

**Some Terminology:**

`Draw #`: The # of random numbers drawn from the random number generator seeded with the time. `Draw 1` for example represents the first random number pulled from the rng. Note that because of the way its seeded and used is a bit flawed, some of the early draws will produce the same results as each other (`Draw 1` = `Draw 3`, `Draw 2` = `Draw 4`, and more).  It is assumed that a draw is not reused. Which draw this or that is because of these repeating results from the early rng draws means it's a bit speculative, but practically speaking it doesn't affect event prediction.

`Weight`: These are used after we modulus the total of the pool of weights with the drawn number. An individual weight divided by the total weights can be thought of as the % chance of it occurring. Percentages assume the rng bias is negligible.

`Variants`: These are just what I called `Draw 2` parts of the GATEs. Consists of possible different routes, maps, or locations a GATE may be held.

**For Implementation:**
- order matters when selecting an event after rng draw, do not mix these up
- do not try to reduce weights, weights of [1,1] and [7,7] will both produce events statistically at 50%/50% but they will not produce identical events after you modulus the sum of weights.

**Further Research:**
There are also other components of GATEs that **may be influenced** by differing weights and draws. Some examples include Leap of Faith layouts, and NPC's you might see during Air Force One.

These also appear to see updates when GATEs are updated. Patch 6.3 introduced `Sylphstep` for Leap of Faith and patch 7.4 introduced `The Cieldalaes` for Air Force One.

## FFXIV v7.4+
### GATEs (Draw 1)
|:00 GATES|Weight|Percent
|-|-|-
|Air Force One|32|32%
|Cliffhanger|33|33%
|Leap of Faith|35|35%
|Total|100|100%

<br>

|:20 GATES|Weight|Percent
|-|-|-
|Any Way the Wind Blows|45|45%
|The Slice is Right|33|33%
|Air Force One|22|22%
|Total|100|100%

<br>

|:40 GATES|Weight|Percent
|-|-|-
|The Slice is Right|12|12%
|Leap of Faith|13|13%
|Air Force One|75|75%
|Total|100|100%
### GATE Variants (Draw 2)
#### Airforce One Cieldalaes Variants for :00 and :40
|Route|Weight|Percent
|-|-|-
|Sea Route|1|33.3%
|Cave Route|1|33.3%
|River Route|1|33.3%
|Total|3|100%
#### Airforce One Golden Saucer Variants for :20
|Route|Weight|Percent
|-|-|-
|Event Square Route|1|33.3%
|Wonder Square Route|1|33.3%
|Round Square Route|1|33.3%
|Total|3|100%
#### Leaf of Faith Variants
|Map|Weight|Percent
|-|-|-
|The Fall of Belah'dia|9|33.3%
|The Falling City of Nym|9|33.3%
|Sylphstep|9|33.3%
|Total|27|100%
#### Cliffhanger Variants
|Location|Weight|Percent
|-|-|-
|Round Square|7|50%
|Wonder Square East|7|50%
|Total|14|100%
### Cliffhanger Hatchling (Draw 4)
|Hatchling|Weight|Percent
|-|-|-
|wayward hatchling|1|14.3%
|storm hatchling|1|14.3%
|serpent hatchling|1|14.3%
|flame hatchling|1|14.3%
|black chocobo chick|1|14.3%
|princely hatchling|1|14.3%
|heavy hatchling|1|14.3%
|Total|7|100%

## FFXIV v6.3 to v7.3
My data only tracks 7.18 to 7.2, so I am assuming these did not change since the implementation of Sylphstep. Data from others suggests that this is accurate to at least 6.5.
### GATEs (Draw 1)
|:00 GATES|Weight|Percent
|-|-|-
|Air Force One|32|32%
|Cliffhanger|45|45%
|Leap of Faith|23|23%
|Total|100|100%

<br>

|:20 GATES|Weight|Percent
|-|-|-
|Any Way the Wind Blows|45|45%
|The Slice is Right|33|33%
|Leap of Faith|22|22%
|Total|100|100%

<br>

|:40 GATES|Weight|Percent
|-|-|-
|The Slice is Right|12|12%
|Air Force One|13|13%
|Leap of Faith|75|75%
|Total|100|100%
