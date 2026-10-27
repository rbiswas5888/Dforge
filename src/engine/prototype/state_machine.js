/**
 * DesignForge AI — Component State Machine Runtime
 * Conforms to Specification Section 6.7
 * Multi-region hierarchical state machines with event-driven transitions, guards, and action dispatch
 */

import { ExpressionEvaluator } from './expressions.js';

export class ComponentStateMachine {
  constructor(instanceIdOrConfig = {}, spec = null, variablesStore = null) {
    this.evaluator = new ExpressionEvaluator();

    if (spec && typeof spec === 'object') {
      // Called as: new ComponentStateMachine(instanceId, spec, variablesStore)
      this.instanceId = instanceIdOrConfig;
      this.spec = spec;
      this.variablesStore = variablesStore;
      this.id = spec.id || instanceIdOrConfig;
      this.name = spec.name || 'ComponentStateMachine';
      this.currentStateId = spec.initialState || (spec.states ? Object.keys(spec.states)[0] : 'idle');
      this.activeStates = { default: this.currentStateId };
      this.states = spec.states || {};
      this.transitions = [];
      for (const [stateId, sDef] of Object.entries(this.states)) {
        for (const t of (sDef.transitions || [])) {
          this.transitions.push({
            from: stateId,
            to: t.target || t.to,
            event: t.trigger || t.event,
            guard: t.guard,
            action: t.action
          });
        }
      }
      this.bindings = {};
      for (const [stateId, sDef] of Object.entries(this.states)) {
        this.bindings[stateId] = sDef.variantBindings || {};
      }
    } else {
      // Called with single config object
      const config = instanceIdOrConfig || {};
      this.id = config.id || `sm_${Math.random().toString(36).substr(2, 9)}`;
      this.name = config.name || 'ComponentStateMachine';
      this.regions = config.regions || {
        default: {
          initial: config.initialState || 'idle',
          states: config.states || ['idle']
        }
      };
      this.activeStates = {};
      for (const [regionName, regionDef] of Object.entries(this.regions)) {
        this.activeStates[regionName] = regionDef.initial || (regionDef.states ? regionDef.states[0] : 'idle');
      }
      this.currentStateId = this.activeStates.default || 'idle';
      this.transitions = config.transitions || [];
      this.bindings = config.bindings || {};
      this.states = config.states || {};
    }
  }

  getCurrentStateId() {
    return this.currentStateId || this.activeStates.default;
  }

  getActiveVariantBindings() {
    const sId = this.getCurrentStateId();
    if (this.states && this.states[sId]?.variantBindings) {
      return this.states[sId].variantBindings;
    }
    return this.bindings[sId] || {};
  }

  dispatch(triggerName) {
    const currentState = this.getCurrentStateId();
    const transitions = this.states?.[currentState]?.transitions ||
      this.transitions.filter(t => t.from === currentState || t.from === '*');

    for (const t of transitions) {
      const ev = t.trigger || t.event;
      if (ev === triggerName) {
        let guardPassed = true;
        if (t.guard) {
          const context = this.variablesStore?.getVariablesSnapshot
            ? this.variablesStore.getVariablesSnapshot()
            : {};
          guardPassed = this.evaluator.evaluatePredicate(t.guard, context);
        }

        if (guardPassed) {
          const target = t.target || t.to;
          this.currentStateId = target;
          this.activeStates.default = target;
          return true;
        }
        return false;
      }
    }
    return false;
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
        let guardPassed = true;
        if (trans.guard) {
          if (expressionEvaluator) {
            guardPassed = expressionEvaluator.evaluatePredicate(trans.guard, context);
          } else if (typeof trans.guard === 'function') {
            guardPassed = Boolean(trans.guard(context));
          } else {
            guardPassed = this.evaluator.evaluatePredicate(trans.guard, context);
          }
        }

        if (guardPassed) {
          const oldState = this.activeStates[region];
          this.activeStates[region] = trans.to;
          this.currentStateId = trans.to;
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
    if (region === 'default') this.currentStateId = state;
  }

  getBinding(state = null) {
    const s = state || this.getCurrentStateId();
    return this.bindings[s] || null;
  }
}
export { ComponentStateMachine as ComponentStateMachineRuntime };
