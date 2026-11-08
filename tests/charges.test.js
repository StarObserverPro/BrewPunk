import test from "node:test";import assert from "node:assert/strict";
import {makeRecipe,brew} from "../core/brew.js";import {taste} from "../core/tasting.js";import {withoutAdjunct} from "../core/adjunct-comparison.js";
import {sessionOf} from "../ui/service.js";
test("two separate additions reach the open cup at their own times, absent from the reference cup",()=>{
 const first={name:"大蒜",grams:500,stage:"boil"},second={name:"咖啡",grams:45,stage:"active",day:5};
 const options={volumeL:25,adjunct:"custom",previousAdditions:[first],customAdjunct:second},seed=23;
 const batch=brew(makeRecipe("house-pale-ale",options),seed),cup=taste(batch);
 assert.deepEqual(cup.additions.map(a=>[a.name,a.startDay]),[["大蒜",0],["咖啡",5]]);
 assert.notDeepEqual(batch.sensory,brew(makeRecipe("house-pale-ale",{...options,previousAdditions:[]}),seed).sensory);
 assert.equal(withoutAdjunct({options,preset:"house-pale-ale",seed}).customAdjunct,undefined);
});
test("resident beer names persist for a saved evening",()=>{const s={};const names=sessionOf(s).house;assert.equal(new Set(names).size,3);assert.deepEqual(sessionOf(JSON.parse(JSON.stringify(s))).house,names);});
