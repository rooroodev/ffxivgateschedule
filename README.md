# FFXIV 7.57 GATE Schedule
This repo [contains a webpage](https://rooroodev.github.io/ffxivgateschedule/) that displays the Golden Saucer GATE Schedule. It's a proof of concept to show what's come of the research I've done over the past year regarding this. Some tools/scripts I've used to get to this point may be added later.

## Tips/Notes
- If notifications are enabled, the page must be kept open to receive them on desktop, ideally as its own window and not a background tab. Background tabs may delay the notifications for too long.
- Apple mobile devices will need to add the page to the home screen to receive notifications. 
- Filters also limit what you are notified for.
- The GATE Schedule is the same for all worlds in all regions (on the same version).

## How does this work?
To put it simply, GATE scheduling is very similar to how FFXIV weather works (its all based on the time), which was [solved/found long ago](https://ffxiv.pf-n.co/skywatcher) (scroll to bottom for algorithm). The primary difference is that it changes every 20 minutes in real life and not every 8 Eorzean hours, as well as alternating what is available every :00, :20, and :40 event, with each of these having their own weights. Details can be found in the `script.js` file.

## Research
Early 2025 I was interested in knowing just how frequently each GATE occurred. So I started logging them in [this spreadsheet](https://docs.google.com/spreadsheets/d/1A7KAJY64JwMHCtwhoODHBRokuxS9qxNxDUeZFVPamuY/edit?usp=sharing). One ambitious goal I had around this time was to see if I could figure out the algorithm behind it based on the data. It was beyond my capabilities to some extent but I tried, throwing around various theories and trying to fit algorithms to my data. I had failed on that front and had given up for a while, just occasionally collecting more data here and there to see if the rates changed from patch to patch.
I had some (what I thought) were pretty solid theories to start:
- I saw that GATEs were the same across all servers and regions. The rng of what happened within the GATE could differ, but the GATE was always the same. This made me believe that this might be implemented based off something like time for simplicity.
- The weather algorithm or something like it was likely what was being used. It seemed to have a similar behavior to how GATEs worked.
- Like the weather algorithm, it was likely the weights added to 100
- I had doubts that info regarding this was in the client and that it was server side. I'm still not sure if GATE scheduling can be found within the client.

But like what I said before, I couldn't do it. This brings us to October 2026. I had heard buzz about AI's like Claude decompiling things and reverse engineering things. It sounded like it worked best when it had verifiable data, particularly when recompiling something. It started to click that it might be able to help me out here, I had the verifiable data for this. I was a bit reluctant and hadn't used AI or chatbots that much before, but I threw a reduced version of the problem, some theories of the implementation, and some of the data I had at it and just wanted to see what it would say. Well, it got me near all the way there and verified the weather algorithms xorshifts were in fact correct and gave me a script to figure out the weights. The data I gave was not conclusive enough so plugging in my remaining data into the script gave me the exact weights for each GATE time (:00, :20, :40). I just had to figure out the weight order for some of them (something that I may have overlooked initially).

The weights for 7.4 through 7.57 are as follows:
**:00**
Air Force One: 32
Cliffhanger: 33
Leap of Faith: 35
**:20**
Any Way the Wind Blows: 45
The Slice is Right: 33
Air Force One: 22
**:40**
The Slice is Right: 12
Leap of Faith: 13
Air Force One: 75

These you could think of are basically the actual % distribution, aside from any slight bias from the prng part of it.

## AI Usage Disclosure
My original research did not involve any AI, including my spreadsheets. AI was not used to write or assist writing this Readme. AI was used to assist with solving this and also make the proof of concept webpage, as I am rusty at web dev and I justed wanted something quick and relatively simple to demonstrate this, though I also wanted to see the capabilities of Claude. I welcome others to do better or incorporate anything here into their own work.