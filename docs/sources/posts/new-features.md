
Since the redesign, Zebradb's development has been moving faster than ever before. Some of the latest changes include:

  * Definitions are now saved on their own <a href="https://github.com/fsvieira/beastdb" target="_blank">BeastDB</a>, which aligns with my plans of making definitions packages.
  * Not-unify now allows for referring to a variable by name, which makes it easier to use and more efficient. However, cascading not-unifies can make the code a little messy and ugly. For example, 'x~'y~'z~'x means that 'x not-unify to 'y, 'y not-unify to 'z, and 'z not-unify to 'x. Similarly, 
  'x~{'y~'z 'z} means that 'x not-unify to 'y, 'y not-unify to 'z, and 'z not-unify to 'x.
  *  A new log flag has been added, which creates an immutable log array (IArray) that is updated for each branch with debug information. This should help to understand what is happening when a branch fails or succeeds.

# Why <a href="https://github.com/fsvieira/beastdb" target="_blank">BeastDB</a>?

I developed <a href="https://github.com/fsvieira/beastdb" target="_blank">BeastDB</a> specifically for Zebradb because I needed to save data on disk in order to handle processing that would take a lot of time and memory. By saving processing on disk, I would be able to resume processing in case of a crash or intentional stop and not be limited by RAM memory limits.

I researched a few databases, and while I thought SQLite would be nice, I had another problem: I needed to efficiently store the same data with different changes. Since I would be creating a lot of branches and each branch would have a small change, delta changes came to mind. However, I didn't think they would be efficient since I would have to replay all changes to get the latest change for each branch. Therefore, I concluded that the best approach was to use an immutable data structure that would use structural sharing. To my knowledge, there is no database that implements this, so I decided to create one myself: <a href="https://github.com/fsvieira/beastdb" target="_blank">BeastDB</a>.

In conclusion, the new redesign of Zebradb with <a href="https://github.com/fsvieira/beastdb" target="_blank">BeastDB</a> has made development faster and more efficient. The addition of the not-unify operator with variable name support and the new log flag make it easier to use and debug. With <a href="https://github.com/fsvieira/beastdb" target="_blank">BeastDB</a>, we can now handle large amounts of data and processing without being limited by memory constraints.


