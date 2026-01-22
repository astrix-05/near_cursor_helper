// HelloNear minimal contract
// Uses near_bindgen macro and Borsh serialization per NEAR Rust SDK.
use near_sdk::near_bindgen;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};

// Contract state
// Stores a single greeting string.
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Contract {
    greeting: String,
}

// Default initialization: sets greeting to "Hello".
impl Default for Contract {
    fn default() -> Self {
        Self { greeting: "Hello".to_string() }
    }
}

// Public methods
// - set_greeting: updates the stored greeting
// - get_greeting: reads the stored greeting
#[near_bindgen]
impl Contract {
    pub fn set_greeting(&mut self, greeting: String) {
        self.greeting = greeting;
    }

    pub fn get_greeting(&self) -> String {
        self.greeting.clone()
    }
}
