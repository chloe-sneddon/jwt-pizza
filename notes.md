# Learning notes

## JWT Pizza code study and debugging

As part of `Deliverable ⓵ Development deployment: JWT Pizza`, start up the application and debug through the code until you understand how it works. During the learning process fill out the following required pieces of information in order to demonstrate that you have successfully completed the deliverable.

| User activity                                       | Frontend component | Backend endpoints | Database SQL |
| --------------------------------------------------- | ------------------ | ----------------- | ------------ |
| View home page                                      | home.tsx           | None              | None         |
| Register new user<br/>(t@jwt.com, pw: test)         | register.tsx       | [POST]/api/auth   | `INSERT INTO user (name, email, password) VALUES (?, ?, ?)` <br/>`INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)` |
| Login new user<br/>(t@jwt.com, pw: test)            |                    | [PUT]/api/auth    | `SELECT * FROM user WHERE email=?` <br/>`SELECT * FROM userRole WHERE userId=?` <br/> `INSERT INTO auth (token, userId) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=token` |
| Order pizza                                         |                    | [POST]/api/order  |`INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now())` <br/> `INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?)` |
| Verify pizza                                        |                    | [POST] /api/order/verify | None |
| View profile page                                   |                    | [GET] /api/order  | `SELECT id, franchiseId, storeId, date FROM dinerOrder WHERE dinerId=? LIMIT ${offset},${config.db.listPerPage}` <br/> `SELECT id, menuId, description, price FROM orderItem WHERE orderId=?` |
| View franchise<br/>(as diner)                       |                    | [GET] /api/franchise/:userId | `SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?` |
| Logout                                              |                    | [DELETE] /api/auth | `DELETE FROM auth WHERE token=?` |
| View About page                                     |                    |                   |              |
| View History page                                   |                    |                   |              |
| Login as franchisee<br/>(f@jwt.com, pw: franchisee) |                    |                   |              |
| View franchise<br/>(as franchisee)                  |                    | [GET] /api/franchise/:userId |`SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?` <br/> `SELECT id, name FROM franchise WHERE id in (${franchiseIds.join(',')})` |
| Create a store                                      |                    | [POST] /api/franchise/:franchiseId/store | `SELECT u.id, u.name, u.email FROM userRole AS ur JOIN user AS u ON u.id=ur.userId WHERE ur.objectId=? AND ur.role='franchisee'` <br/> `SELECT s.id, s.name, COALESCE(SUM(oi.price), 0) AS totalRevenue FROM dinerOrder AS do JOIN orderItem AS oi ON do.id=oi.orderId RIGHT JOIN store AS s ON s.id=do.storeId WHERE s.franchiseId=? GROUP BY s.id` <br/> `INSERT INTO store (franchiseId, name) VALUES (?, ?)` <br/> `SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?` <br/> `SELECT id, name FROM franchise WHERE id in (${franchiseIds.join(',')})` |
| Close a store                                       |                    | [DELETE] /api/franchise/:franchiseId/store/:storeId | `SELECT u.id, u.name, u.email FROM userRole AS ur JOIN user AS u ON u.id=ur.userId WHERE ur.objectId=? AND ur.role='franchisee'` <br/> `SELECT s.id, s.name, COALESCE(SUM(oi.price), 0) AS totalRevenue FROM dinerOrder AS do JOIN orderItem AS oi ON do.id=oi.orderId RIGHT JOIN store AS s ON s.id=do.storeId WHERE s.franchiseId=? GROUP BY s.id` <br/> `DELETE FROM store WHERE franchiseId=? AND id=?` |
| Login as admin<br/>(a@jwt.com, pw: admin)           |                    |                   |              |
| View Admin page                                     |                    |                   |              |
| Create a franchise for t@jwt.com                    |                    |                   |              |
| Close the franchise for t@jwt.com                   |                    |                   |              |
