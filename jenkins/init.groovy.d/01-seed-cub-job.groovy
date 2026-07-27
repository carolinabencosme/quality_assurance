import jenkins.model.Jenkins
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition
import hudson.model.Cause

/**
 * Seed del job demo Cub + primer build para historial visible en :8082.
 * El pipeline completo del PDF (Maven/Node) vive en /workspace/cub/Jenkinsfile.
 */
def jenkins = Jenkins.instance
def name = 'cub-inventory-qas'
def demoFile = new File('/workspace/cub/Jenkinsfile.demo')

if (!demoFile.exists()) {
  println "WARN: no existe ${demoFile}; se omite seed del job demo."
  return
}

def script = demoFile.getText('UTF-8')
def job = jenkins.getItem(name)
if (job == null) {
  job = jenkins.createProject(WorkflowJob, name)
  println "Created job ${name}"
} else {
  println "Updating job ${name}"
}

job.setDescription('Pipeline visual Cub (Proyecto Final V3) — stages del PDF + smoke del stack local. Historial de builds en el dashboard.')
job.setDefinition(new CpsFlowDefinition(script, true))
job.save()

if (job.getLastBuild() == null) {
  def future = job.scheduleBuild2(0, new Cause.UserIdCause('admin'))
  println "Scheduled initial build for ${name}: ${future}"
}

jenkins.save()
