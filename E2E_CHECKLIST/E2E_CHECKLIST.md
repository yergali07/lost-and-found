## E2E testing in the UI 
## Authentication checks (UI)
User A -> Tairuly
password -> password
## Register User A
![alt text](image.png)
✔ User A can register
✔ Register succeeds -> redirect to login

## Login User A
![alt text](image-1.png)
![alt text](image-2.png)
✔ User A can login
✔ redirect to /items
✔ Navbar shows username + Logout

## Logout works
![alt text](image-3.png)
![alt text](image-4.png)
![alt text](image-6.png)
![alt text](image-5.png)
✔ Logout works
✔ Protected routes redirect to login


## Items flow (UI)
## Create an item (as User A)
![alt text](image-7.png)
![alt text](image-9.png)
![alt text](image-8.png)
![alt text](image-10.png)
✔ User A can create an item
✔ Item appears in Items list

## My Items (User A)
![alt text](image-11.png)
![alt text](image-12.png)
![alt text](image-14.png)
✔ My Items shows only my items
![alt text](image-13.png)
✔ Open item detail
![alt text](image-15.png)
✔ Edit item
![alt text](image-16.png)
✔ Delete item(copy of item created for next tests)


## Claims flow (UI)
User B -> Temirlan
password -> otherpassword
## Register + login User B
![alt text](image-17.png)
✔ User B can register/login

## Submit a claim (User B)
![alt text](image-19.png)
![alt text](image-18.png)
![alt text](image-20.png)
![alt text](image-21.png)
![alt text](image-22.png)
✔ User B can submit a claim
✔ Success message appears
✔ Reopening of item gives message that user already has pending for this item

## My Claims (User B)
![alt text](image-24.png)
![alt text](image-23.png)
✔ My Claims shows my submitted claims
✔ Status shows pending

## Owner reviews claims (User A)
![alt text](image-25.png)
![alt text](image-26.png)
✔ Owner can see claims for my items

## Approve/Reject claim (User A + User B)
![alt text](image-27.png)
![alt text](image-29.png)
![alt text](image-28.png)
✔ Owner can approve/reject claim
✔ Status is now approved/rejected

## Resolve claim (User A + User B)
![alt text](image-30.png)
![alt text](image-31.png)
![alt text](image-32.png)
✔ Owner can resolve claim
✔ Status is now resolved


## Find item functions
![alt text](image-42.png) 
✔ Search bar works
![alt text](image-43.png)
![alt text](image-44.png)
✔ Search by type works
![alt text](image-45.png)
![alt text](image-46.png)
✔ Search by category works
![alt text](image-47.png)
![alt text](image-48.png)
✔ Search by status works
![alt text](image-49.png)
![alt text](image-48.png)
✔ Search using everything together


## Error handling
## Login errors
![alt text](image-33.png)
![alt text](image-34.png)
✔ Username and password are required error
✔ Invalid credentials error

## Register errors 
![alt text](image-35.png)
![alt text](image-36.png)
![alt text](image-37.png)
![alt text](image-38.png)
✔ Username, email and password are required errors
![alt text](image-39.png)
✔ Passwords do not match.
![alt text](image-41.png)
✔ A user with this username already exists
![alt text](image-40.png)
✔ A user with this email already exists.