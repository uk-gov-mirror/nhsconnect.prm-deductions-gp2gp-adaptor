environment    = "test"
component_name = "gp2gp-adaptor"
dns_name       = "gp2gp-adaptor"
repo_name      = "prm-deductions-gp2gp-adaptor"

task_cpu    = 256
task_memory = 512
port        = 3000

service_desired_count = "2"

alb_deregistration_delay = 15

