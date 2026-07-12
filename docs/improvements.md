1. we need to simplify. drop different designs or similar components in favor of a unified design and less components. if features would get lost ask, if design is lost, do it. goal is to simplify component structure, scss and design code to a minimum.   
   1. check for signal usage where possible. observables in effects are okay for now. question could we get rid of them?
2. can we make the store layz loaded using (lazy `provideState` with  `createFeature`)?
   1. maybe not the settings, bzw the shared states
3. can the PWA cache the apps assets? de.json, en.json and the icons and images?
