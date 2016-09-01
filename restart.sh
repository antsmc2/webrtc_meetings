#this file needs to improve the way it restarts the service
#file="./supervisord.pid"
if [-f ./supervisord.pid]
then
    pid=$(cat $file)
    echo "found supervisor process: $pid"
    echo "killing $pid"
    kill $pid
else
    echo "No process ID found. Seems supervisor is not running"
fi
echo "Cleaning up the attendance register"
python manage.py clear_attendance_register
echo 'starting supervisor'
supervisord -c supervisord.conf
echo 'done! service is up!!!'
