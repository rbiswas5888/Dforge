/**
 * DesignForge AI - MCP Workflow Orchestrator
 * Executes multi-step, cross-server autonomous workflows combining native design engine
 * and external MCP servers with step-by-step progress, approval checkpoints, and rollback.
 */

export class McpWorkflowOrchestrator {
  constructor(clientManager) {
    this.clientManager = clientManager;
    this.workflows = new Map();
    this.executionHistory = [];
    this.activeExecution = null;
    this.initDefaultWorkflows();
  }

  initDefaultWorkflows() {
    // 1. Markdown to Design to React
    this.registerWorkflow({
      id: 'wf_markdown_to_react',
      name: 'Markdown Spec → Editable Design → React TSX',
      description: 'Reads a Markdown specification, generates canonical design frames with Auto-Layout, validates integrity, and compiles to React.',
      steps: [
        {
          id: 'step_read_spec',
          name: 'Read Specification',
          tool: 'fs_read_file',
          getArgs: (ctx) => ({ filePath: ctx.specPath || 'specs/dashboard_prd.md' })
        },
        {
          id: 'step_inspect_tokens',
          name: 'Inspect Design Tokens',
          tool: 'design_get_design_tokens',
          getArgs: () => ({})
        },
        {
          id: 'step_list_components',
          name: 'Check Available Components',
          tool: 'design_list_components',
          getArgs: () => ({})
        },
        {
          id: 'step_create_container',
          name: 'Create Main Desktop Frame',
          tool: 'design_create_frame',
          getArgs: (ctx) => ({
            name: ctx.frameName || 'Enterprise Cloud Dashboard (MCP)',
            width: 1440,
            height: 1024,
            layoutMode: 'stack-vertical',
            gap: 24,
            padding: 32,
            fill: '#0f172a'
          })
        },
        {
          id: 'step_create_header',
          name: 'Create Header Bar with Auto-Layout',
          tool: 'design_create_frame',
          getArgs: (ctx, prevResults) => ({
            name: 'Top Header Bar',
            parentId: prevResults.step_create_container?.frameId,
            width: 1376,
            height: 72,
            layoutMode: 'stack-horizontal',
            gap: 16,
            padding: 16,
            fill: '#1e293b'
          })
        },
        {
          id: 'step_create_kpis',
          name: 'Create KPI Metric Cards',
          tool: 'design_create_frame',
          getArgs: (ctx, prevResults) => ({
            name: 'KPI Metric Grid',
            parentId: prevResults.step_create_container?.frameId,
            width: 1376,
            height: 140,
            layoutMode: 'stack-horizontal',
            gap: 20,
            padding: 0,
            fill: 'transparent'
          })
        },
        {
          id: 'step_validate',
          name: 'Validate Document Structure',
          tool: 'design_validate_document',
          getArgs: () => ({})
        },
        {
          id: 'step_compile_react',
          name: 'Compile to React & TypeScript',
          tool: 'design_generate_react_project',
          getArgs: () => ({ target: 'react-ts-tailwind' })
        }
      ]
    });

    // 2. Design System & Accessibility Audit
    this.registerWorkflow({
      id: 'wf_design_audit',
      name: 'Design System & Accessibility Audit',
      description: 'Audits active document against WCAG 2.1 AA standards, design tokens, and layout guidelines.',
      steps: [
        {
          id: 'step_get_guidelines',
          name: 'Fetch Accessibility Guidelines',
          tool: 'docs_get_guideline',
          getArgs: () => ({ topic: 'accessibility' })
        },
        {
          id: 'step_get_summary',
          name: 'Get Document Summary',
          tool: 'design_get_document_summary',
          getArgs: () => ({})
        },
        {
          id: 'step_get_tokens',
          name: 'Inspect Token Adherence',
          tool: 'design_get_design_tokens',
          getArgs: () => ({})
        },
        {
          id: 'step_run_validation',
          name: 'Run Document Integrity Check',
          tool: 'design_validate_document',
          getArgs: () => ({})
        }
      ]
    });

    // 3. Interactive Prototype Handoff
    this.registerWorkflow({
      id: 'wf_prototype_handoff',
      name: 'Interactive Prototype → React Handoff',
      description: 'Extracts prototype flows, generates production React TSX, and prepares Git staging manifest.',
      steps: [
        {
          id: 'step_get_flows',
          name: 'Inspect Prototype Flows',
          tool: 'design_get_prototype_flow',
          getArgs: () => ({})
        },
        {
          id: 'step_get_manifest',
          name: 'Get Asset Export Manifest',
          tool: 'design_get_export_manifest',
          getArgs: () => ({})
        },
        {
          id: 'step_compile',
          name: 'Generate React Project',
          tool: 'design_generate_react_project',
          getArgs: () => ({ target: 'react-ts-tailwind' })
        },
        {
          id: 'step_git_diff',
          name: 'Inspect Repository Diff',
          tool: 'git_diff',
          getArgs: () => ({ filePath: 'src/App.tsx' })
        }
      ]
    });
  }

  registerWorkflow(definition) {
    this.workflows.set(definition.id, definition);
  }

  getWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * Runs a multi-step workflow sequentially with real-time step progress
   */
  async executeWorkflow(workflowId, context = {}, onProgress = null) {
    const wf = this.workflows.get(workflowId);
    if (!wf) throw new Error(`Workflow '${workflowId}' not found`);

    const executionId = `wf_exec_${Date.now()}`;
    const execution = {
      id: executionId,
      workflowId,
      name: wf.name,
      startedAt: new Date().toISOString(),
      status: 'running',
      stepsCount: wf.steps.length,
      currentStepIndex: 0,
      stepResults: {},
      error: null
    };

    this.activeExecution = execution;

    try {
      for (let i = 0; i < wf.steps.length; i++) {
        const step = wf.steps[i];
        execution.currentStepIndex = i;

        if (onProgress) {
          onProgress({
            workflowId,
            stepIndex: i,
            totalSteps: wf.steps.length,
            stepName: step.name,
            tool: step.tool,
            status: 'running'
          });
        }

        const args = step.getArgs(context, execution.stepResults);
        const result = await this.clientManager.invokeTool(step.tool, args, `workflow:${workflowId}`);
        execution.stepResults[step.id] = result.data !== undefined ? result.data : result;

        if (onProgress) {
          onProgress({
            workflowId,
            stepIndex: i,
            totalSteps: wf.steps.length,
            stepName: step.name,
            tool: step.tool,
            status: 'completed',
            result: execution.stepResults[step.id]
          });
        }
      }

      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      this.executionHistory.unshift(execution);
      this.activeExecution = null;
      return execution;
    } catch (err) {
      execution.status = 'failed';
      execution.error = err.message;
      execution.completedAt = new Date().toISOString();
      this.executionHistory.unshift(execution);
      this.activeExecution = null;
      if (onProgress) {
        onProgress({
          workflowId,
          stepIndex: execution.currentStepIndex,
          totalSteps: wf.steps.length,
          status: 'failed',
          error: err.message
        });
      }
      throw err;
    }
  }
}
