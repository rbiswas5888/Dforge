/**
 * DesignForge AI — Component State Machine Runtime
 * Conforms to Specification Section 6.7
 * Multi-region hierarchical state machines with event-driven transitions, guards, and action dispatch
 */

export class ComponentStateMachine {
  constructor(config = {}) {
    this.id = config.id || `sm_${Math.random().toString(36).substr(2, 9)}`;
    this.name = config.name || 'ComponentStateMachine';
    this.regions = config.regions || {
      default: {
        initial: config.initialState || 'idle',
        states: config.states || ['idle']
      }
    };

    // Current state per region: { regionName: currentState }
    this.activeStates = {};
    for (const [regionName, regionDef] of Object.entries(this.regions)) {
      this.activeStates[regionName] = regionDef.initial || (regionDef.states ? regionDef.states[0] : 'idle');
    }

    // Transitions: array of { region, event, from, to, guard, action }
    this.transitions = config.transitions || [];

    // State property/variant bindings: { stateName: { variantId, properties } }
    this.bindings = config.bindings || {};
  }

  /**
   * Dispatches an event to the state machine
   * @param {string} eventName - e.g. 'focus', 'blur', 'submit', 'hover'
   * @param {Object} context - evaluation scope for guards
   * @param {Function} expressionEvaluator - evaluator instance
   * @returns {{ transitioned: boolean, changedRegions: Object, actions: Array }}
   */
  send(eventName, context = {}, expressionEvaluator = null) {
    let transitioned = false;
    const changedRegions = {};
    const triggeredActions = [];

    for (const trans of this.transitions) {
      const region = trans.region || 'default';
      const currentState = this.activeStates[region];

      if (trans.event === eventName && (trans.from === currentState || trans.from === '*')) {
        // Evaluate guard if specified
        let guardPassed = true;
        if (trans.guard) {
          if (expressionEvaluator) {
            guardPassed = expressionEvaluator.evaluatePredicate(trans.guard, context);
          } else if (typeof trans.guard === 'function') {
            guardPassed = Boolean(trans.guard(context));
          }
        }

        if (guardPassed) {
          const oldState = this.activeStates[region];
          this.activeStates[region] = trans.to;
          changedRegions[region] = { from: oldState, to: trans.to };
          transitioned = true;

          if (trans.action) {
            triggeredActions.push(trans.action);
          }
        }
      }
    }

    return {
      transitioned,
      activeStates: { ...this.activeStates },
      changedRegions,
      actions: triggeredActions
    };
  }

  getState(region = 'default') {
    return this.activeStates[region];
  }

  setState(region, state) {
    this.activeStates[region] = state;
  }

  getBinding(state = null) {
    const s = state || this.activeStates.default;
    return this.bindings[s] || null;
  }
}
export { ComponentStateMachine as ComponentStateMachineRuntime };
