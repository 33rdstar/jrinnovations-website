=====================================
UC 1: MANAGE USERS
=====================================

USE CASE: 		MANAGE USERS
ACTORS:   		ADMINS
DESCRIPTION: 	This use case will allow the admin to manage users information if need be eg Blacklisting users who violate user guidelines or are beomg reported for such.
PAGE IN CHARGE: MANAGE USERS

=====================================
UC 1.1: MANAGE USERS - BACK OFFICERS
=====================================
USE CASE: 		MANAGE USERS - BACK OFFICERS
ACTORS:	  		ADMINS
DESCRIPTION:	This use case creates users specific for managing listings. 
MAIN FLOW:		
1. Input user details - Name, email, mobile number, NRC, gender
2. Generate unique code used as OTP(one time password) for verifying account when officer first logs in
3. When officer logs in their taken to LISTINGS page. they are not allowed to see any other page asside from that unless otherwise

PAGES IN CHARGE: ADMIN - MANAGE USERS
				 OFFICERS - LISTINGS PAGE


=====================================
UC 2: MANAGE LISTINGS
=====================================
ACTORS:       BACK OFFICE MANAGER, ADMIN
ROLE: 	  	  Communicates with agents to verify property listings are accurate and valid
DESCRIPTION:	  Scammers are determined, they can pay for a listing just to take advantage of the platform. this officer will be the QA for listings and flag any listings that are unverified or fraudulent 

CONSTRAINTS: ADMINS can see and monitor this page but officers can see information about the listing, who listed it and their details as well as the images 

PAGE IN CHARGE: LISTINGS


=====================================
UC 3: MANAGE MARKETPLACE
=====================================
ACTORS:       BACK OFFICE MANAGER, ADMIN
ROLE: 	  	  Views and deletes products if need be
DESCRIPTION:  Scammers are determined, they can list a product just to take advantage of the platform. The admin and/or officer will be the QA for this page and flag any listings that are unverified or fraudulent 

PAGE IN CHARGE: MARKETPLACE


=====================================
UC 3: MANAGE QUERIES
=====================================
ACTORS: 		ADMIN
ROLE:			Respond to user queries and reports 
DESCRIPTION:	The admins should be able to see user queries, reports and anything that could be an issue either a bug in the app or reporting misconduct

MAIN FLOW:
1. User makes a report on the mobile app
2. System gets the information from the database


PAGE IN CHARGE:	CUSTOMER SERVICE

