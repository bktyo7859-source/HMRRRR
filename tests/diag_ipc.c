#include <stdio.h>
#include <sys/ipc.h>
#include <sys/shm.h>
#include <sys/sem.h>
#include <sys/msg.h>
#include <errno.h>
#include <string.h>

int main() {
    int shmid = shmget(IPC_PRIVATE, 1024, IPC_CREAT | 0666);
    if (shmid < 0) {
        printf("shmget failed: errno=%d (%s)\n", errno, strerror(errno));
    } else {
        printf("shmget succeeded! shmid=%d\n", shmid);
        shmctl(shmid, IPC_RMID, NULL);
    }

    int semid = semget(IPC_PRIVATE, 1, IPC_CREAT | 0666);
    if (semid < 0) {
        printf("semget failed: errno=%d (%s)\n", errno, strerror(errno));
    } else {
        printf("semget succeeded! semid=%d\n", semid);
        semctl(semid, 0, IPC_RMID);
    }

    int msgid = msgget(IPC_PRIVATE, IPC_CREAT | 0666);
    if (msgid < 0) {
        printf("msgget failed: errno=%d (%s)\n", errno, strerror(errno));
    } else {
        printf("msgget succeeded! msgid=%d\n", msgid);
        msgctl(msgid, IPC_RMID, NULL);
    }
    return 0;
}
