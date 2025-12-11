# AWS Deployment (outline)

- Services: ECS/Fargate for `api` and `web`, RDS Postgres, ElastiCache Redis, S3 for documents/exports, ALB + ACM certs, CloudFront for CDN, SES/SMTP for email.
- Images: build from `apps/api/Dockerfile` and `apps/web/Dockerfile`; push to ECR.
- Config: SSM Parameter Store/Secrets Manager for env vars and keys (DB, Redis, MinIO/S3, Paystack).
- Networking: VPC with public ALB and private subnets for ECS tasks/RDS/Redis; security groups to limit DB/Redis to ECS.
- IaC: Terraform modules to be added for VPC, RDS, ElastiCache, ECS services, ALB, S3, CloudFront, ACM.

Next steps: wire Terraform skeleton and GitHub Actions workflow for build/push/deploy after environment variables are confirmed.
