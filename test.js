class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }

    defineDynamicProperty(property) {
        Object.defineProperty(this, property, {
            get: function() {
                return `Getting ${property}: ${this[`_${property}`]}`;
            },
            configurable: true
        });
        Object.defineProperty(this, property, {
            set: function(value) {
                console.log(`Setting ${property} to: ${value}`);
                this[`_${property}`] = value;
            }
        })
    }
}

let p = new Person('Alice', 30);

// Dynamically define a getter and setter for a property 'job'
p.defineDynamicProperty('job');

// Now you can use the getter and setter for 'job'
p.job = 'Developer';  // Setting job to: Developer
console.log(p.job);    // Getting job: Developer
