# METRICS

How will we know we are successful? Key metric here will be retained users. At
what rate do experimenters snooze their tabs? Do users snooze tabs with some
consistency or does the novelty wear of quickly?

The basic question we seek to answer is: does snooze tabs provide a useful tool
for its users in Test Pilot?

* Do people snooze tabs and at what rate? 
	* x = time, y = number of snoozes (vanity metric)
	* x = time, y = snoozes per user
* Do people close returned tabs without focusing them and at what rate?
	* x= time, y = snoozes focused and snoozes dismissed w/o focus
* Are the measurably different rates of returned tab engagement for snoozes of different lengths.
	* bar graph showing rate at which different snooze length tabs are focused and closed (should show custom times as well (these can be clustered into one group)
* What is the overall distribution of snooze times across all users?
	* Bar graph showing distribution of snooze times
* Do people set custom times, and at what rate, 
	* x = time, y = number of custom snooze events
* Do people re-snooze previously snoozed tabs?
	* x = time, y = snoozes of previously snoozed tabs per user

## Data Collection

### Server Side
There is currently no server side component to Snooze Tabs.

### Client Side
Snooze Tabs will use Test Pilot's Telemetry wrapper with no batching of data.
Details of when pings are sent are below, along with examples of the `payload`
portion of a `testpilottest` telemetry ping for each scenario.

* The user opens the snooze panel
```js
{ "event": "panel-opened" }
```

* The user snoozes a tab, choosing either a pre-defined time or a custom time
```js
{
  "event": "snoozed",
  "snooze_time": 1484345836165,
  "snooze_time_type": "tomorrow"
}
```

* A snoozed tab wakes up as a live tab
```js
{
  "event": "woken",
  "snooze_time": 1484345836165,
  "snooze_time_type": "tomorrow"
}
```

* A previously snoozed tab is focused
```js
{
  "event": "focused",
  "snooze_time": 1484345836165,
  "snooze_time_type": "tomorrow"
}
```

* A previously snoozed tab is closed without having been focused
```js
{
  "event": "closed-unfocused",
  "snooze_time": 1484345836165,
  "snooze_time_type": "tomorrow"
}
```

* A previously snoozed tab is snoozed again after waking, but not tracked after browser restart or if the tab was closed and reopened
```js
{
  "event": "resnoozed",
  "snooze_time": 1484345836165,
  "snooze_time_type": "tomorrow"
}
```

* A snoozed tab is cancelled from the management panel
```js
{
  "event": "cancelled",
  "snooze_time": 1484345836165,
  "snooze_time_type": "tomorrow"
}
```

* A snoozed tab is updated from the management panel
```js
{
  "event": "updated",
  "snooze_time": 1484345836165,
  "snooze_time_type": "tomorrow"
}
```

* A snoozed tab is clicked from the management panel
```js
{
  "event": "clicked",
  "snooze_time": 1484345836165,
  "snooze_time_type": "tomorrow"
}
```

A Redshift schema for the payload:

```lua
local schema = {
--   column name       field type   length  attributes   field name
    {"client_id",        "VARCHAR",    255,     nil,       GUID()},
    {"event",            "VARCHAR",    255,     nil,       "Fields[payload.event]"},
    {"snooze_time",      "INTEGER",    nil,     nil,       "Fields[payload.snooze_time]"},
    {"snooze_time_type", "VARCHAR",    255,     nil,       "Fields[payload.snooze_time_type]"},
}
```

All Mozilla data is kept by default for 180 days and in accordance with our
privacy policies.
