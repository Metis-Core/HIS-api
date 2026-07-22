# Project Structure Overview

I have created the models for the project and organized shared functionality into a separate folder outside the main application.

## Modules

- `consultation` For managing the consultations
- `traige` For the traige 
- `auth` for authenetication management
- `users` This is for user role management
- `pharmacy` This is for phamarcy management
- `inventory` This is for managing inventory
- `lab` For lab management 
- `analytics` I have craeted this one for analystics to management 
- `patients` This module will be for patient records search and all. 
- `notifications` This one is to handle all notifications emails and push notifications
- `payments` THis is for payments ofcourse i envision it for cash, mobile money and insurance. 
- `auditlogs` THis is for ofcours audits and all. 


## Common and Core Folder

- Folders outside the src, for global utilities and shared logic.
- `common` Reusable helpers, constants, DTOs
- `core` Global guards, filters, interceptors, DB config
