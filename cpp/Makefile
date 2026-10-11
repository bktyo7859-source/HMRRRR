CXX ?= g++
CXXFLAGS = -std=c++17 -Wall -Wextra -pedantic -O2 -pthread
INCLUDES = -Iinclude

SRCS = src/main.cpp \
       src/shared_memory.cpp \
       src/semaphore.cpp \
       src/message_queue.cpp \
       src/patient_monitor.cpp \
       src/dispatcher.cpp \
       src/doctor_worker.cpp \
       src/audit_logger.cpp \
       src/race_lab.cpp \
       src/controller.cpp

OBJS = $(SRCS:.cpp=.o)
TARGET = medsync_sim

ifeq ($(OS),Windows_NT)
    TARGET_BIN = $(TARGET).exe
else
    TARGET_BIN = $(TARGET)
endif

all: $(TARGET_BIN)

$(TARGET_BIN): $(OBJS)
	$(CXX) $(CXXFLAGS) -o $@ $(OBJS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

clean:
	rm -f src/*.o $(TARGET) $(TARGET).exe medsync_audit.log

test: all
	./$(TARGET_BIN) --race-counter protected 5000
	./$(TARGET_BIN) --race-duplicate protected

.PHONY: all clean test
