import json
import boto3
import uuid
import datetime
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')

def respond(status_code, body):
    response = {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps(body)
    }
    return response

def get_user_by_email(email):
    try:
        resp = table.query(
            IndexName='EmailIndex',
            KeyConditionExpression=Key('email').eq(email)
        )
        items = resp.get('Items', [])
        return items[0] if items else None
    except ClientError as e:
        print(f"Error querying by email: {e}")
        return None

def get_user_by_username(username):
    try:
        resp = table.query(
            IndexName='UsernameIndex',
            KeyConditionExpression=Key('username').eq(username)
        )
        items = resp.get('Items', [])
        return items[0] if items else None
    except ClientError as e:
        print(f"Error querying by username: {e}")
        return None

def lambda_handler(event, context):
    try:
        http_method = event.get('httpMethod')
        path = event.get('path', '')
        
        # Handle CORS preflight
        if http_method == 'OPTIONS':
            return respond(200, {})

        # Only parse body for POST and PUT requests
        body = {}
        if http_method in ['POST', 'PUT']:
            raw_body = event.get('body')
            if raw_body:
                try:
                    body = json.loads(raw_body)
                except json.JSONDecodeError:
                    return respond(400, {'error': 'Invalid JSON body'})

        # --- Authentication Endpoints ---
        if path == '/login' and http_method == 'POST':
            email = body.get('email')
            password = body.get('password')

            if not email or not password:
                return respond(400, {'error': 'Email and password are required'})

            user = get_user_by_email(email)
            if not user or user.get('password') != password:
                return respond(401, {'error': 'Invalid credentials'})

            user_data = {
                'userId': user['userId'],
                'username': user['username'],
                'email': user['email'],
                'name': user.get('name', '')
            }
            return respond(200, {
                'message': 'Login successful',
                'user': user_data,
                'token': str(uuid.uuid4())  # In production, use JWT
            })

        elif path == '/register' and http_method == 'POST':
            username = body.get('username')
            email = body.get('email')
            password = body.get('password')
            name = body.get('name')

            if not username or not email or not password or not name:
                return respond(400, {'error': 'All fields are required'})

            if get_user_by_username(username):
                return respond(409, {'error': 'Username already exists'})
            if get_user_by_email(email):
                return respond(409, {'error': 'Email already exists'})

            new_user_id = str(uuid.uuid4())
            item = {
                'userId': new_user_id,
                'username': username,
                'email': email,
                'password': password,
                'name': name,
                'createdAt': str(datetime.datetime.now())
            }

            table.put_item(Item=item)

            user_data = {
                'userId': new_user_id,
                'username': username,
                'email': email,
                'name': name
            }
            return respond(201, {
                'message': 'User registered successfully',
                'user': user_data
            })

        elif path == '/forgot-password' and http_method == 'POST':
            email = body.get('email')

            if not email:
                return respond(400, {'error': 'Email is required'})

            user = get_user_by_email(email)
            if not user:
                return respond(404, {'error': 'User not found'})
            
            # Generate reset token
            reset_token = str(uuid.uuid4())
            reset_token_expiry = (datetime.datetime.now() + datetime.timedelta(minutes=30)).isoformat()

            # Store reset token in DynamoDB
            table.update_item(
                Key={'userId': user['userId']},
                UpdateExpression="SET passwordResetToken = :token, passwordResetTokenExpiry = :expiry",
                ExpressionAttributeValues={
                    ':token': reset_token,
                    ':expiry': reset_token_expiry
                }
            )

            # Return the reset token (INSECURE - FOR DEMO ONLY)
            return respond(200, {'message': 'Password reset token generated', 'token': reset_token})
        
        elif path == '/reset-password' and http_method == 'POST':
            token = body.get('token')
            password = body.get('password')

            if not token or not password:
                return respond(400, {'error': 'Token and password are required'})
            
            # Get user by email
            email = body.get('email')
            user = get_user_by_email(email)
            if not user:
                return respond(404, {'error': 'User not found'})

            # Verify reset token
            if user.get('passwordResetToken') != token:
                return respond(400, {'error': 'Invalid reset token'})
            
            # Check if token is expired
            if user.get('passwordResetTokenExpiry') < datetime.datetime.now().isoformat():
                return respond(400, {'error': 'Reset token has expired'})
            
            # Update password
            table.update_item(
                Key={'userId': user['userId']},
                UpdateExpression="SET password = :p REMOVE passwordResetToken, passwordResetTokenExpiry",
                ExpressionAttributeValues={':p': password}
            )

            return respond(200, {'message': 'Password reset successfully'})

         # --- User Management Endpoints ---
        elif path.startswith('/users'):
            user_id = event.get('pathParameters', {}).get('userId') if event.get('pathParameters') else None

            if http_method == 'GET':
                if user_id:
                    response = table.get_item(Key={'userId': user_id})
                    user = response.get('Item')
                    if not user:
                        return respond(404, {'error': 'User not found'})
                    user.pop('password', None)
                    return respond(200, user)
                else:
                    response = table.scan()
                    users = response.get('Items', [])
                    for user in users:
                        user.pop('password', None)
                    return respond(200, users)

            elif http_method == 'PUT' and user_id:
                update_data = {k: v for k, v in body.items() if k != 'userId'}
                if not update_data:
                    return respond(400, {'error': 'No fields to update'})

                if 'password' in update_data:
                    return respond(400, {'error': 'Use forgot-password endpoint to change password'})

                update_expr = "SET " + ", ".join(f"#{k} = :{k}" for k in update_data)
                expr_attr_names = {f"#{k}": k for k in update_data}
                expr_attr_values = {f":{k}": v for k, v in update_data.items()}

                response = table.update_item(
                    Key={'userId': user_id},
                    UpdateExpression=update_expr,
                    ExpressionAttributeNames=expr_attr_names,
                    ExpressionAttributeValues=expr_attr_values,
                    ReturnValues="ALL_NEW"
                )
                updated_user = response.get('Attributes', {})
                updated_user.pop('password', None)
                return respond(200, updated_user)

            elif http_method == 'DELETE' and user_id:
                table.delete_item(Key={'userId': user_id})
                return respond(200, {'message': 'User deleted successfully'})

        return respond(404, {'error': 'Endpoint not found'})

    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return respond(500, {'error': 'Database error'})
    except Exception as e:
        print(f"Unexpected error: {e}")
        return respond(500, {'error': 'Internal server error'})
